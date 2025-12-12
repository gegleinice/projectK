/**
 * 企享云自然人相关API
 * 完整的办税人登录流程
 */

import { QixiangyunResponse, NaturalPersonCompany } from './types';
import { getQixiangyunService } from './base';
import { encryptPassword } from './rsa-utils';
import { formatAreaCode } from './area-codes';

// ========================
// 类型定义
// ========================

/** 自然人登录请求 */
export interface NatureTpassRequest {
  gryhm: string;        // 个人用户名(手机号)
  gryhmm: string;       // 密码(RSA加密后)
  areaCode: string;     // 地区编码
}

/** 自然人登录响应 */
export interface NatureTpassResponse {
  taskId: string;       // 任务ID
  needSms?: boolean;    // 是否需要短信验证
  status?: string;      // 状态
  msg?: string;         // 消息
}

/** 短信验证码请求 */
export interface TpassPushSmsRequest {
  taskId: string;       // 任务ID
  smsCode: string;      // 短信验证码
}

/** 企业列表请求 */
export interface ZrrOrgListRequest {
  gryhm: string;        // 个人用户名(手机号)
  gryhmm: string;       // 密码(RSA加密后)
  areaCode: string;     // 地区编码
}

/** 企业列表响应 */
export interface ZrrOrgListResponse {
  list: Array<{
    nsrsbh: string;     // 纳税人识别号
    nsrmc: string;      // 纳税人名称
    areaCode: string;   // 地区编码
    sflx?: string;      // 身份类型
    glzt?: string;      // 关联状态
  }>;
  total: number;        // 企业数量
}

/** 快速登录检查请求 */
export interface CheckAppCacheRequest {
  nsrsbh: string;       // 纳税人识别号
  areaCode: string;     // 地区编码
  gryhm: string;        // 个人用户名
  gryhmm: string;       // 个人用户密码(加密)
}

/** 快速登录检查响应 */
export interface CheckAppCacheResponse {
  canFastLogin: boolean;  // 是否可快速登录
  cacheValid: boolean;    // 缓存是否有效
  expireTime?: string;    // 过期时间
}

/** 认证状态 */
export type AuthStatus = 'idle' | 'login_pending' | 'sms_required' | 'sms_pending' | 'success' | 'error';

/** 认证结果 */
export interface AuthResult {
  status: AuthStatus;
  taskId?: string;
  message?: string;
  companies?: NaturalPersonCompany[];
  needSms?: boolean;
}

// ========================
// API 函数
// ========================

/**
 * 步骤1: 自然人APP登录
 * 发起登录请求，可能返回需要短信验证
 */
export async function natureTpassLogin(
  phoneNumber: string,
  password: string,
  areaCode: string
): Promise<AuthResult> {
  const service = getQixiangyunService();
  
  // 使用RSA公钥加密密码
  const encryptedPassword = await encryptPassword(password);
  
  const requestData: NatureTpassRequest = {
    gryhm: phoneNumber,
    gryhmm: encryptedPassword,
    areaCode: formatAreaCode(areaCode)
  };
  
  try {
    const response = await service.makeRequest<NatureTpassResponse>(
      '/v2/public/zrr/login/getNatureTpass',
      requestData
    );
    
    if (!response.success) {
      return {
        status: 'error',
        message: response.message || '登录失败'
      };
    }
    
    const data = response.data;
    
    // 检查是否需要短信验证
    if (data?.needSms) {
      return {
        status: 'sms_required',
        taskId: data.taskId,
        needSms: true,
        message: '请输入短信验证码'
      };
    }
    
    // 直接登录成功
    return {
      status: 'success',
      taskId: data?.taskId,
      message: '登录成功'
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || '登录请求失败'
    };
  }
}

/**
 * 步骤2: 上传短信验证码
 */
export async function submitSmsCode(
  taskId: string,
  smsCode: string
): Promise<AuthResult> {
  const service = getQixiangyunService();
  
  const requestData: TpassPushSmsRequest = {
    taskId: taskId,
    smsCode: smsCode
  };
  
  try {
    const response = await service.makeRequest<any>(
      '/v2/public/zrr/login/tpasspushsms',
      requestData
    );
    
    if (!response.success) {
      return {
        status: 'error',
        message: response.message || '验证码验证失败'
      };
    }
    
    return {
      status: 'success',
      message: '验证成功'
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || '验证码提交失败'
    };
  }
}

/**
 * 步骤3: 获取自然人企业列表
 */
export async function getZrrOrgList(
  phoneNumber: string,
  password: string,
  areaCode: string
): Promise<NaturalPersonCompany[]> {
  const service = getQixiangyunService();
  
  // 使用RSA公钥加密密码
  const encryptedPassword = await encryptPassword(password);
  
  const requestData: ZrrOrgListRequest = {
    gryhm: phoneNumber,
    gryhmm: encryptedPassword,
    areaCode: formatAreaCode(areaCode)
  };
  
  const response = await service.makeRequest<ZrrOrgListResponse>(
    '/v2/public/zrr/login/zrrOrgList',
    requestData
  );
  
  if (!response.success || !response.data) {
    throw new Error(response.message || '获取企业列表失败');
  }
  
  // 转换为标准格式
  return response.data.list.map((item, index) => ({
    xh: index,
    nsrsbh: item.nsrsbh,
    nsrmc: item.nsrmc,
    sflx: item.sflx || 'BSY',
    glzt: item.glzt || '00'
  }));
}

/**
 * 步骤4: 检查是否可快速登录
 */
export async function checkAppCache(
  nsrsbh: string,
  areaCode: string,
  phoneNumber: string,
  password: string
): Promise<boolean> {
  const service = getQixiangyunService();
  
  const encryptedPassword = await encryptPassword(password);
  
  const requestData: CheckAppCacheRequest = {
    nsrsbh: nsrsbh,
    areaCode: formatAreaCode(areaCode),
    gryhm: phoneNumber,
    gryhmm: encryptedPassword
  };
  
  try {
    const response = await service.makeRequest<CheckAppCacheResponse>(
      '/v2/public/login/app/checkAppCache',
      requestData
    );
    
    if (response.success && response.data) {
      return response.data.canFastLogin && response.data.cacheValid;
    }
    
    return false;
  } catch {
    return false;
  }
}

// ========================
// 完整认证流程
// ========================

/**
 * 完整的自然人认证流程
 * 处理登录 -> 短信验证(如需要) -> 获取企业列表
 */
export class NaturalPersonAuthFlow {
  private phoneNumber: string = '';
  private password: string = '';
  private areaCode: string = '';
  private taskId: string = '';
  private status: AuthStatus = 'idle';
  
  /**
   * 开始认证流程
   */
  async startAuth(
    phoneNumber: string,
    password: string,
    areaCode: string
  ): Promise<AuthResult> {
    this.phoneNumber = phoneNumber;
    this.password = password;
    this.areaCode = areaCode;
    this.status = 'login_pending';
    
    // 步骤1: 尝试登录
    const loginResult = await natureTpassLogin(phoneNumber, password, areaCode);
    
    if (loginResult.status === 'sms_required') {
      this.taskId = loginResult.taskId || '';
      this.status = 'sms_required';
      return loginResult;
    }
    
    if (loginResult.status === 'success') {
      // 登录成功，获取企业列表
      return await this.fetchCompanies();
    }
    
    this.status = 'error';
    return loginResult;
  }
  
  /**
   * 提交短信验证码
   */
  async submitSms(smsCode: string): Promise<AuthResult> {
    if (!this.taskId) {
      return {
        status: 'error',
        message: '请先发起登录请求'
      };
    }
    
    this.status = 'sms_pending';
    
    // 步骤2: 提交验证码
    const smsResult = await submitSmsCode(this.taskId, smsCode);
    
    if (smsResult.status === 'success') {
      // 验证成功，获取企业列表
      return await this.fetchCompanies();
    }
    
    this.status = 'error';
    return smsResult;
  }
  
  /**
   * 获取企业列表
   */
  private async fetchCompanies(): Promise<AuthResult> {
    try {
      // 步骤3: 获取企业列表
      const companies = await getZrrOrgList(
        this.phoneNumber,
        this.password,
        this.areaCode
      );
      
      if (companies.length === 0) {
        this.status = 'error';
        return {
          status: 'error',
          message: '该办税人名下暂无可用企业'
        };
      }
      
      this.status = 'success';
      return {
        status: 'success',
        companies: companies,
        message: `成功获取 ${companies.length} 家企业`
      };
    } catch (error: any) {
      this.status = 'error';
      return {
        status: 'error',
        message: error.message || '获取企业列表失败'
      };
    }
  }
  
  /**
   * 获取当前状态
   */
  getStatus(): AuthStatus {
    return this.status;
  }
  
  /**
   * 重置流程
   */
  reset(): void {
    this.phoneNumber = '';
    this.password = '';
    this.areaCode = '';
    this.taskId = '';
    this.status = 'idle';
  }
}

// ========================
// 兼容旧接口（保持向后兼容）
// ========================

/**
 * 自然人获取企业列表（简化版，用于快速登录场景）
 * @deprecated 建议使用 NaturalPersonAuthFlow
 */
export async function queryNaturalPersonCompanies(
  phoneNumber: string,
  password: string,
  areaCode: string = '4400'
): Promise<NaturalPersonCompany[]> {
  return getZrrOrgList(phoneNumber, password, areaCode);
}

/**
 * 验证办税人信息
 */
export async function validateTaxPayer(
  phoneNumber: string,
  password: string,
  areaCode: string = '4400'
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const companies = await getZrrOrgList(phoneNumber, password, areaCode);
    
    if (companies.length === 0) {
      return {
        success: false,
        message: '该办税人名下暂无可用企业'
      };
    }
    
    return {
      success: true,
      message: `成功获取 ${companies.length} 家企业`,
      count: companies.length
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '验证失败，请检查手机号和密码'
    };
  }
}
