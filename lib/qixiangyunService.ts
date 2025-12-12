// 企享云 API 服务封装
import crypto from 'crypto';
import {
  QXYResponse,
  TokenResponse,
  TaskResponse,
  TaskStatusResponse,
  CompanyBasicInfo,
  ProductInfo,
  CustomerInfo,
  InvoiceCreateRequest,
  InvoiceInfo,
  QXYAPIError,
  PollingConfig,
  TaskStatus
} from './types/qixiangyun';

/** 企享云服务配置 */
interface QXYServiceConfig {
  appKey: string;
  appSecret: string;
  baseURL?: string;
  timeout?: number;
}

/** Token 缓存 */
interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // 过期时间戳
}

/**
 * 企享云 API 服务类
 * 封装所有企享云 API 调用，提供统一接口
 */
export class QixiangyunService {
  private appKey: string;
  private appSecret: string;
  private baseURL: string;
  private timeout: number;
  private tokenCache: TokenCache | null = null;
  
  // Token 缓存键
  private readonly TOKEN_CACHE_KEY = 'qxy_token_cache';
  
  constructor(config: QXYServiceConfig) {
    this.appKey = config.appKey;
    this.appSecret = config.appSecret;
    this.baseURL = config.baseURL || 'https://api.qixiangyun.com';
    this.timeout = config.timeout || 30000;
    
    // 从本地存储加载 Token
    this.loadTokenFromStorage();
  }
  
  // ==================== Token 管理 ====================
  
  /**
   * 从本地存储加载 Token
   */
  private loadTokenFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cached = localStorage.getItem(this.TOKEN_CACHE_KEY);
      if (cached) {
        this.tokenCache = JSON.parse(cached);
        // 检查是否过期
        if (this.tokenCache && this.tokenCache.expiresAt < Date.now()) {
          this.tokenCache = null;
          localStorage.removeItem(this.TOKEN_CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load token from storage:', error);
    }
  }
  
  /**
   * 保存 Token 到本地存储
   */
  private saveTokenToStorage(token: TokenCache): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.TOKEN_CACHE_KEY, JSON.stringify(token));
    } catch (error) {
      console.error('Failed to save token to storage:', error);
    }
  }
  
  /**
   * 获取 Access Token (带自动刷新)
   */
  async getAccessToken(): Promise<string> {
    // 如果有缓存且未过期，直接返回
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 600000) { // 提前10分钟刷新
      return this.tokenCache.accessToken;
    }
    
    // 如果有 refresh_token，尝试刷新
    if (this.tokenCache && this.tokenCache.refreshToken) {
      try {
        await this.refreshAccessToken();
        return this.tokenCache!.accessToken;
      } catch (error) {
        console.warn('Token refresh failed, getting new token:', error);
      }
    }
    
    // 重新获取 Token
    return await this.login();
  }
  
  /**
   * 登录获取 Token
   */
  async login(): Promise<string> {
    const secretMD5 = crypto.createHash('md5')
      .update(this.appSecret)
      .digest('hex')
      .toLowerCase();
    
    const response = await this.request<TokenResponse>('/v2/public/oauth2/login', {
      method: 'POST',
      body: {
        grant_type: 'client_credentials',
        client_appkey: this.appKey,
        client_secret: secretMD5
      },
      skipAuth: true // 登录接口不需要认证
    });
    
    // 缓存 Token (过期时间减去1小时作为安全边界)
    this.tokenCache = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: Date.now() + response.expires_in - 3600000
    };
    
    this.saveTokenToStorage(this.tokenCache);
    
    return response.access_token;
  }
  
  /**
   * 刷新 Access Token
   */
  async refreshAccessToken(): Promise<string> {
    if (!this.tokenCache || !this.tokenCache.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await this.request<TokenResponse>('/v2/public/oauth2/login', {
      method: 'POST',
      body: {
        grant_type: 'refresh_token',
        refresh_token: this.tokenCache.refreshToken
      },
      skipAuth: true
    });
    
    this.tokenCache = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: Date.now() + response.expires_in - 3600000
    };
    
    this.saveTokenToStorage(this.tokenCache);
    
    return response.access_token;
  }
  
  // ==================== 企业信息 ====================
  
  /**
   * 查询企业基本信息
   * @param nsrsbh 纳税人识别号
   * @param areaCode 地区编码
   */
  async queryCompanyInfo(nsrsbh: string, areaCode: string): Promise<CompanyBasicInfo> {
    // 1. 发起任务
    const taskResponse = await this.request<TaskResponse>('/v2/public/beginOrgInfoTask', {
      method: 'POST',
      body: { nsrsbh, areaCode }
    });
    
    // 2. 轮询任务结果
    const result = await this.pollTaskResult<TaskStatusResponse>(
      '/v2/public/queryOrgInfoTask',
      {
        taskId: taskResponse.taskId,
        nsrsbh
      },
      {
        maxAttempts: 30,
        interval: 2000
      }
    );
    
    // 3. 提取企业信息
    if (result.jcxx?.taxCompanyEnterpriseInfoDtoPageResult) {
      return result.jcxx.taxCompanyEnterpriseInfoDtoPageResult;
    }
    
    throw new QXYAPIError('4000', '未获取到企业信息');
  }
  
  // ==================== 商品管理 ====================
  
  /**
   * 查询商品列表
   */
  async queryProducts(nsrsbh: string, areaCode: string, keyword?: string): Promise<ProductInfo[]> {
    const response = await this.request<{ list: ProductInfo[] }>('/v2/invoice/qdfp/spxxCx', {
      method: 'POST',
      body: {
        nsrsbh,
        areaCode,
        spmc: keyword || '', // 商品名称
        pageNo: 1,
        pageSize: 100
      }
    });
    
    return response.list || [];
  }
  
  /**
   * 新增商品
   */
  async addProduct(nsrsbh: string, areaCode: string, product: Partial<ProductInfo>): Promise<boolean> {
    await this.request('/v2/invoice/qdfp/spxxAdd', {
      method: 'POST',
      body: {
        nsrsbh,
        areaCode,
        ...product
      }
    });
    
    return true;
  }
  
  /**
   * 更新商品
   */
  async updateProduct(nsrsbh: string, areaCode: string, product: ProductInfo): Promise<boolean> {
    await this.request('/v2/invoice/qdfp/spxxUpdate', {
      method: 'POST',
      body: {
        nsrsbh,
        areaCode,
        ...product
      }
    });
    
    return true;
  }
  
  /**
   * 删除商品
   */
  async deleteProduct(nsrsbh: string, areaCode: string, productId: string): Promise<boolean> {
    await this.request('/v2/invoice/qdfp/spxxDel', {
      method: 'POST',
      body: {
        nsrsbh,
        areaCode,
        id: productId
      }
    });
    
    return true;
  }
  
  // ==================== 客户管理 ====================
  
  /**
   * 查询客户列表
   */
  async queryCustomers(nsrsbh: string, areaCode: string, keyword?: string): Promise<CustomerInfo[]> {
    const response = await this.request<{ list: CustomerInfo[] }>('/v2/invoice/qdfp/khxxCx', {
      method: 'POST',
      body: {
        nsrsbh,
        areaCode,
        gfmc: keyword || '',
        pageNo: 1,
        pageSize: 100
      }
    });
    
    return response.list || [];
  }
  
  /**
   * 新增客户
   */
  async addCustomer(nsrsbh: string, areaCode: string, customer: Partial<CustomerInfo>): Promise<boolean> {
    await this.request('/v2/invoice/qdfp/khxxAdd', {
      method: 'POST',
      body: {
        nsrsbh,
        areaCode,
        ...customer
      }
    });
    
    return true;
  }
  
  /**
   * 更新客户
   */
  async updateCustomer(nsrsbh: string, areaCode: string, customer: CustomerInfo): Promise<boolean> {
    await this.request('/v2/invoice/qdfp/khxxUpdate', {
      method: 'POST',
      body: {
        nsrsbh,
        areaCode,
        ...customer
      }
    });
    
    return true;
  }
  
  /**
   * 删除客户
   */
  async deleteCustomer(nsrsbh: string, areaCode: string, customerId: string): Promise<boolean> {
    await this.request('/v2/invoice/qdfp/khxxDel', {
      method: 'POST',
      body: {
        nsrsbh,
        areaCode,
        id: customerId
      }
    });
    
    return true;
  }
  
  // ==================== 发票开具 ====================
  
  /**
   * 开具发票
   */
  async createInvoice(invoiceData: InvoiceCreateRequest): Promise<InvoiceInfo> {
    // 发起开票任务 (异步接口)
    const taskResponse = await this.request<TaskResponse>('/v2/invoice/qdfp/fpkjZzs', {
      method: 'POST',
      body: invoiceData
    });
    
    // 轮询任务结果
    const result = await this.pollTaskResult<any>(
      '/v2/invoice/qdfp/asynResult',
      {
        taskId: taskResponse.taskId,
        nsrsbh: invoiceData.nsrsbh
      },
      {
        maxAttempts: 60,
        interval: 3000
      }
    );
    
    return result as InvoiceInfo;
  }
  
  /**
   * 查询已开发票列表
   */
  async queryInvoices(
    nsrsbh: string,
    areaCode: string,
    startDate: string,
    endDate: string
  ): Promise<InvoiceInfo[]> {
    const response = await this.request<{ list: InvoiceInfo[] }>('/v2/invoice/qdfp/fpcx', {
      method: 'POST',
      body: {
        nsrsbh,
        areaCode,
        kprqq: startDate,
        kprqz: endDate,
        pageNo: 1,
        pageSize: 100
      }
    });
    
    return response.list || [];
  }
  
  /**
   * 查询发票明细
   */
  async queryInvoiceDetail(nsrsbh: string, areaCode: string, invoiceNumber: string): Promise<InvoiceInfo> {
    const response = await this.request<InvoiceInfo>('/v2/invoice/qdfp/fpmx', {
      method: 'POST',
      body: {
        nsrsbh,
        areaCode,
        fphm: invoiceNumber
      }
    });
    
    return response;
  }
  
  /**
   * 下载发票版式文件
   */
  async downloadInvoicePDF(nsrsbh: string, areaCode: string, invoiceNumbers: string[]): Promise<string[]> {
    const response = await this.request<{ urls: string[] }>('/v2/invoice/qdfp/bswjxzBatch', {
      method: 'POST',
      body: {
        nsrsbh,
        areaCode,
        fphms: invoiceNumbers
      }
    });
    
    return response.urls || [];
  }
  
  // ==================== 通用方法 ====================
  
  /**
   * 生成签名
   */
  private generateSignature(accessToken: string, timestamp: number, body?: any): string {
    const bodyStr = body ? JSON.stringify(body) : '';
    const signData = `${accessToken}${timestamp}${bodyStr}`;
    
    return crypto.createHash('md5')
      .update(signData)
      .digest('hex')
      .toUpperCase();
  }
  
  /**
   * 发起 HTTP 请求
   */
  private async request<T = any>(
    path: string,
    options: {
      method: 'GET' | 'POST';
      body?: any;
      skipAuth?: boolean;
    }
  ): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const timestamp = Date.now();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // 添加认证头
    if (!options.skipAuth) {
      const accessToken = await this.getAccessToken();
      headers['access_token'] = accessToken;
      headers['req_date'] = timestamp.toString();
      headers['req_sign'] = this.generateSignature(accessToken, timestamp, options.body);
    }
    
    try {
      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: QXYResponse<T> = await response.json();
      
      // 检查业务状态
      if (!result.success || result.code !== '2000') {
        throw new QXYAPIError(
          result.code,
          result.message || 'API request failed',
          result.reqId
        );
      }
      
      return result.data as T;
    } catch (error) {
      if (error instanceof QXYAPIError) {
        throw error;
      }
      
      throw new QXYAPIError(
        '5000',
        error instanceof Error ? error.message : 'Unknown error',
        undefined,
        error
      );
    }
  }
  
  /**
   * 轮询任务结果
   */
  private async pollTaskResult<T extends TaskStatusResponse>(
    queryPath: string,
    queryBody: any,
    config: PollingConfig = {}
  ): Promise<T> {
    const maxAttempts = config.maxAttempts || 30;
    const interval = config.interval || 2000;
    const timeout = config.timeout || 60000;
    
    const startTime = Date.now();
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      // 检查超时
      if (Date.now() - startTime > timeout) {
        throw new QXYAPIError('TIMEOUT', 'Task polling timeout');
      }
      
      const result = await this.request<T>(queryPath, {
        method: 'POST',
        body: queryBody
      });
      
      // 检查任务状态
      if (result.status === 3) {
        // 任务完成
        return result;
      } else if (result.status === -1) {
        // 任务失败
        throw new QXYAPIError('TASK_FAILED', result.statusMsg || 'Task failed');
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    }
    
    throw new QXYAPIError('MAX_ATTEMPTS', 'Max polling attempts reached');
  }
}

// ==================== 单例导出 ====================

let serviceInstance: QixiangyunService | null = null;

/**
 * 获取企享云服务实例 (单例模式)
 */
export function getQixiangyunService(): QixiangyunService {
  if (!serviceInstance) {
    const appKey = process.env.NEXT_PUBLIC_QIXIANGYUN_APP_KEY;
    const appSecret = process.env.NEXT_PUBLIC_QIXIANGYUN_APP_SECRET;
    
    if (!appKey || !appSecret) {
      throw new Error('Missing Qixiangyun credentials in environment variables');
    }
    
    serviceInstance = new QixiangyunService({
      appKey,
      appSecret,
      baseURL: process.env.QIXIANGYUN_API_BASE_URL
    });
  }
  
  return serviceInstance;
}

/**
 * 重置服务实例 (用于测试)
 */
export function resetQixiangyunService(): void {
  serviceInstance = null;
}

