// 企享云API错误处理

export class QixiangyunError extends Error {
  constructor(
    public code: string,
    message: string,
    public reqId?: string
  ) {
    super(message);
    this.name = 'QixiangyunError';
  }
}

// 错误码映射
export const ERROR_MESSAGES: Record<string, string> = {
  // 认证相关
  '4001': '认证失败，请检查AppKey和AppSecret',
  '4002': 'access_token已过期，正在自动刷新...',
  '4003': '无效的access_token',
  '4004': 'AppKey不存在',
  '4005': 'AppSecret错误',
  
  // 业务相关
  '5001': '税号不存在或格式错误',
  '5002': '企业信息查询失败',
  '5003': '商品信息不存在',
  '5004': '客户信息不存在',
  '5005': '发票开具失败',
  '5006': '购方税号校验失败',
  '5007': '销方税号校验失败',
  '5008': '税收编码不存在',
  
  // 异步任务
  '700009': '请求已转为异步处理',
  '700010': '异步任务执行中',
  '700011': '异步任务失败',
  '700012': '异步任务超时',
  
  // 系统错误
  '9001': '系统繁忙，请稍后再试',
  '9002': '网络请求失败',
  '9999': '未知错误'
};

/**
 * 处理企享云API响应错误
 */
export function handleQixiangyunError(response: any): void {
  if (!response.success || response.code !== '2000') {
    const friendlyMsg = ERROR_MESSAGES[response.code] || response.message || '未知错误';
    throw new QixiangyunError(response.code, friendlyMsg, response.reqId);
  }
}

/**
 * 获取友好的错误消息
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof QixiangyunError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '操作失败，请稍后重试';
}

