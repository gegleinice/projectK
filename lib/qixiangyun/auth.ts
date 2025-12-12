// 企享云API认证管理器
import CryptoJS from 'crypto-js';
import { QixiangyunError, handleQixiangyunError } from './errors';

interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

interface LoginResponse {
  code: string;
  success: boolean;
  message: string | null;
  reqId: string;
  data: {
    access_token: string;
    expires_in: number; // milliseconds
    refresh_token: string;
  } | null;
}

/**
 * 企享云认证管理器
 * 负责 access_token 的获取、刷新和签名生成
 */
export class QixiangyunAuthManager {
  private baseUrl: string;
  private appKey: string;
  private appSecret: string;
  private tokenCache: TokenCache | null = null;
  
  // Token缓存键名
  private readonly TOKEN_CACHE_KEY = 'qixiangyun_token_cache';

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_QIXIANGYUN_BASE_URL || 'https://mcp.qixiangyun.com';
    this.appKey = process.env.NEXT_PUBLIC_QIXIANGYUN_APPKEY || '';
    this.appSecret = process.env.NEXT_PUBLIC_QIXIANGYUN_APPSECRET || '';

    if (!this.appKey || !this.appSecret) {
      console.warn('⚠️ 企享云API凭证未配置，将使用模拟数据');
    }

    // 尝试从localStorage加载缓存的token
    this.loadTokenFromCache();
  }

  /**
   * 从localStorage加载缓存的token
   */
  private loadTokenFromCache(): void {
    if (typeof window === 'undefined') return;

    try {
      const cached = localStorage.getItem(this.TOKEN_CACHE_KEY);
      if (cached) {
        const tokenCache: TokenCache = JSON.parse(cached);
        // 检查是否过期（留1小时缓冲）
        if (tokenCache.expiresAt > Date.now() + 3600000) {
          this.tokenCache = tokenCache;
          console.log('✅ 从缓存加载 access_token');
        } else {
          console.log('⏰ 缓存的 access_token 即将过期，需要刷新');
          localStorage.removeItem(this.TOKEN_CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('加载token缓存失败:', error);
      localStorage.removeItem(this.TOKEN_CACHE_KEY);
    }
  }

  /**
   * 保存token到localStorage
   */
  private saveTokenToCache(tokenCache: TokenCache): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.TOKEN_CACHE_KEY, JSON.stringify(tokenCache));
    } catch (error) {
      console.error('保存token缓存失败:', error);
    }
  }

  /**
   * 生成AppSecret的MD5哈希
   */
  private getAppSecretMd5(): string {
    return CryptoJS.MD5(this.appSecret).toString().toLowerCase();
  }

  /**
   * 检查是否需要刷新token
   */
  private needsRefresh(): boolean {
    if (!this.tokenCache) return true;
    
    // 距离过期不足1小时，需要刷新
    const oneHour = 3600000;
    return this.tokenCache.expiresAt <= Date.now() + oneHour;
  }

  /**
   * 获取access_token
   * 自动处理过期和刷新逻辑
   */
  async getAccessToken(): Promise<string> {
    // 如果有有效的缓存token，直接返回
    if (this.tokenCache && !this.needsRefresh()) {
      return this.tokenCache.accessToken;
    }

    // 如果有refresh_token，尝试刷新
    if (this.tokenCache?.refreshToken) {
      try {
        await this.refreshAccessToken();
        return this.tokenCache!.accessToken;
      } catch (error) {
        console.warn('刷新token失败，重新登录:', error);
        // 刷新失败，清空缓存，继续执行登录逻辑
        this.tokenCache = null;
      }
    }

    // 重新登录获取token
    await this.login();
    return this.tokenCache!.accessToken;
  }

  /**
   * 登录获取access_token
   */
  private async login(): Promise<void> {
    const reqDate = Date.now().toString();
    const body = {
      grant_type: 'client_credentials',
      client_appkey: this.appKey,
      client_secret: this.getAppSecretMd5()
    };
    const bodyStr = JSON.stringify(body);

    // 生成登录签名（登录接口不需要access_token）
    const signContent = `${this.appKey}${reqDate}${bodyStr}${this.getAppSecretMd5()}`;
    const reqSign = CryptoJS.MD5(signContent).toString().toLowerCase();

    try {
      const response = await fetch(`${this.baseUrl}/v2/public/oauth2/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'req_sign': reqSign,
          'req_date': reqDate
        },
        body: bodyStr
      });

      if (!response.ok) {
        throw new QixiangyunError(
          'NETWORK_ERROR',
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result: LoginResponse = await response.json();
      handleQixiangyunError(result);

      if (!result.data) {
        throw new QixiangyunError('LOGIN_FAILED', '登录返回数据为空');
      }

      // 保存token
      this.tokenCache = {
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token,
        expiresAt: Date.now() + result.data.expires_in
      };

      this.saveTokenToCache(this.tokenCache);
      console.log('✅ 成功获取 access_token，有效期:', Math.floor(result.data.expires_in / 86400000), '天');
    } catch (error) {
      console.error('❌ 登录失败:', error);
      throw error;
    }
  }

  /**
   * 使用refresh_token刷新access_token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.tokenCache?.refreshToken) {
      throw new QixiangyunError('NO_REFRESH_TOKEN', '没有可用的 refresh_token');
    }

    const reqDate = Date.now().toString();
    const body = {
      grant_type: 'refresh_token',
      refresh_token: this.tokenCache.refreshToken
    };
    const bodyStr = JSON.stringify(body);

    // 刷新token时的签名逻辑与登录相同
    const signContent = `${this.appKey}${reqDate}${bodyStr}${this.getAppSecretMd5()}`;
    const reqSign = CryptoJS.MD5(signContent).toString().toLowerCase();

    try {
      const response = await fetch(`${this.baseUrl}/v2/public/oauth2/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'req_sign': reqSign,
          'req_date': reqDate
        },
        body: bodyStr
      });

      if (!response.ok) {
        throw new QixiangyunError(
          'NETWORK_ERROR',
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result: LoginResponse = await response.json();
      handleQixiangyunError(result);

      if (!result.data) {
        throw new QixiangyunError('REFRESH_FAILED', '刷新token返回数据为空');
      }

      // 更新token
      this.tokenCache = {
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token,
        expiresAt: Date.now() + result.data.expires_in
      };

      this.saveTokenToCache(this.tokenCache);
      console.log('✅ 成功刷新 access_token');
    } catch (error) {
      console.error('❌ 刷新token失败:', error);
      throw error;
    }
  }

  /**
   * 生成请求签名
   * @param body 请求体JSON字符串
   * @returns 签名字符串和时间戳
   */
  async generateSignature(body: string): Promise<{ reqSign: string; reqDate: string }> {
    const accessToken = await this.getAccessToken();
    const reqDate = Date.now().toString();
    
    // 签名算法: MD5(access_token + req_date + body + client_secret_md5)
    const signContent = `${accessToken}${reqDate}${body}${this.getAppSecretMd5()}`;
    const reqSign = CryptoJS.MD5(signContent).toString().toLowerCase();

    return { reqSign, reqDate };
  }

  /**
   * 清除token缓存（用于登出或测试）
   */
  clearTokenCache(): void {
    this.tokenCache = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_CACHE_KEY);
    }
    console.log('🗑️ 已清除 token 缓存');
  }

  /**
   * 检查是否已配置API凭证
   */
  isConfigured(): boolean {
    return Boolean(this.appKey && this.appSecret);
  }
}

// 导出单例
let authManager: QixiangyunAuthManager | null = null;

export function getAuthManager(): QixiangyunAuthManager {
  if (!authManager) {
    authManager = new QixiangyunAuthManager();
  }
  return authManager;
}

