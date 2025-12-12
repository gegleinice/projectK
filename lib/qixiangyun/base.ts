// 企享云API基础服务类
import { getAuthManager } from './auth';
import { QixiangyunError, handleQixiangyunError } from './errors';
import type { QixiangyunResponse } from './types';

/**
 * 企享云API基础服务
 * 提供统一的请求封装和错误处理
 */
export class QixiangyunBaseService {
  private baseUrl: string;
  private authManager: ReturnType<typeof getAuthManager>;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_QIXIANGYUN_BASE_URL || 'https://mcp.qixiangyun.com';
    this.authManager = getAuthManager();
  }

  /**
   * 发送API请求（通过API代理解决CORS问题）
   * @param endpoint API端点
   * @param body 请求体
   * @param requireAuth 是否需要认证
   */
  protected async request<T = any>(
    endpoint: string,
    body: any,
    requireAuth: boolean = true
  ): Promise<QixiangyunResponse<T>> {
    try {
      console.log(`📤 请求: ${endpoint}`, body);

      // 通过Next.js API路由代理请求，避免CORS问题
      const response = await fetch('/api/qixiangyun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint,
          body,
          requireAuth
        })
      });

      if (!response.ok) {
        throw new QixiangyunError(
          'NETWORK_ERROR',
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result: QixiangyunResponse<T> = await response.json();
      
      console.log(`📥 响应: ${endpoint}`, { 
        code: result.code, 
        success: result.success
      });

      // 处理响应错误
      handleQixiangyunError(result);

      return result;
    } catch (error) {
      if (error instanceof QixiangyunError) {
        throw error;
      }
      
      console.error(`❌ 请求失败: ${endpoint}`, error);
      throw new QixiangyunError(
        '9002',
        `网络请求失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 异步任务轮询
   * @param checkFn 检查函数，返回 {completed, result}
   * @param options 轮询选项
   */
  protected async poll<T>(
    checkFn: () => Promise<{ completed: boolean; result?: T; error?: string }>,
    options: {
      maxAttempts?: number;
      interval?: number;
      timeoutMessage?: string;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 30,
      interval = 2000,
      timeoutMessage = '操作超时，请稍后查询'
    } = options;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const { completed, result, error } = await checkFn();

      if (error) {
        throw new QixiangyunError('TASK_FAILED', error);
      }

      if (completed && result) {
        return result;
      }

      if (attempt < maxAttempts) {
        console.log(`⏳ 轮询中 (${attempt}/${maxAttempts})...`);
        await this.sleep(interval);
      }
    }

    throw new QixiangyunError('TASK_TIMEOUT', timeoutMessage);
  }

  /**
   * 延迟函数
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取企业ID（从环境变量或用户配置）
   */
  protected getAggOrgId(): string {
    const aggOrgId = process.env.QIXIANGYUN_AGG_ORG_ID;
    if (!aggOrgId) {
      console.warn('⚠️ QIXIANGYUN_AGG_ORG_ID 未配置，某些功能可能无法使用');
      return '';
    }
    return aggOrgId;
  }

  /**
   * 获取默认税号
   */
  protected getDefaultNsrsbh(): string {
    const nsrsbh = process.env.QIXIANGYUN_DEFAULT_NSRSBH;
    if (!nsrsbh) {
      console.warn('⚠️ QIXIANGYUN_DEFAULT_NSRSBH 未配置');
      return '';
    }
    return nsrsbh;
  }

  /**
   * 获取默认地区编码
   */
  protected getDefaultAreaCode(): string {
    return process.env.QIXIANGYUN_DEFAULT_AREA_CODE || '44';
  }

  /**
   * 检查是否启用回退机制
   */
  protected isFallbackEnabled(): boolean {
    return process.env.QIXIANGYUN_ENABLE_FALLBACK !== 'false';
  }

  /**
   * 公开的请求方法（供外部调用）
   */
  public async makeRequest<T = any>(
    endpoint: string,
    body: any,
    requireAuth: boolean = true
  ): Promise<QixiangyunResponse<T>> {
    return this.request<T>(endpoint, body, requireAuth);
  }
}

// 单例实例
let serviceInstance: QixiangyunBaseService | null = null;

/**
 * 获取企享云服务实例
 */
export function getQixiangyunService(): QixiangyunBaseService {
  if (!serviceInstance) {
    serviceInstance = new QixiangyunBaseService();
  }
  return serviceInstance;
}

