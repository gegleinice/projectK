// 用户认证系统 - 模拟实现

export interface User {
  id: string;
  phone: string;
  name: string;
  avatar?: string;
  createdAt: string;
  // 企业绑定状态
  companyBound: boolean;
  company?: CompanyInfo;
}

export interface CompanyInfo {
  // 基础工商信息
  name: string;                    // 企业名称
  creditCode: string;              // 统一社会信用代码
  legalPerson: string;             // 法定代表人
  registeredCapital: string;       // 注册资本
  establishDate: string;           // 成立日期
  businessStatus: string;          // 经营状态
  
  // 地址信息
  registeredAddress: string;       // 注册地址
  province: string;                // 省份
  city: string;                    // 城市
  district: string;                // 区县
  
  // 业务信息
  businessScope: string;           // 经营范围
  mainBusiness: string[];          // 主营业务（AI解析）
  industryCategory: string;        // 行业类别
  
  // 开票相关
  invoiceAddress: string;          // 开票地址
  invoicePhone: string;            // 开票电话
  bankName: string;                // 开户银行
  bankAccount: string;             // 银行账号
  
  // 税务信息
  taxType: '一般纳税人' | '小规模纳税人';
  invoiceQuota: number;            // 开票额度
}

// 模拟用户数据库
const mockUsers: Record<string, User> = {
  '13800138000': {
    id: 'user_001',
    phone: '13800138000',
    name: '张总',
    createdAt: '2024-01-15',
    companyBound: true,
    company: {
      name: '深圳市智慧科技有限公司',
      creditCode: '91440300MA5XXXXXX',
      legalPerson: '张明',
      registeredCapital: '500万人民币',
      establishDate: '2020-03-15',
      businessStatus: '存续',
      registeredAddress: '深圳市南山区科技园南区科苑路15号',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      businessScope: '软件开发；信息技术咨询服务；计算机系统服务；数据处理和存储服务；人工智能应用软件开发；云计算装备技术服务',
      mainBusiness: ['软件开发', '信息技术咨询', '云计算服务', 'AI应用开发'],
      industryCategory: '信息传输、软件和信息技术服务业',
      invoiceAddress: '深圳市南山区科技园南区科苑路15号',
      invoicePhone: '0755-86000000',
      bankName: '招商银行深圳科技园支行',
      bankAccount: '7559 2000 0000 0000',
      taxType: '一般纳税人',
      invoiceQuota: 5000000
    }
  }
};

// 验证码存储（实际应用中应该用 Redis）
const verificationCodes: Record<string, { code: string; expireAt: number }> = {};

// 发送验证码
export function sendVerificationCode(phone: string): { success: boolean; message: string } {
  // 生成6位验证码
  const code = Math.random().toString().slice(2, 8);
  
  // 存储验证码，5分钟有效
  verificationCodes[phone] = {
    code,
    expireAt: Date.now() + 5 * 60 * 1000
  };
  
  console.log(`[模拟短信] 向 ${phone} 发送验证码: ${code}`);
  
  return {
    success: true,
    message: `验证码已发送到 ${phone.slice(0, 3)}****${phone.slice(-4)}`
  };
}

// 验证验证码
export function verifyCode(phone: string, code: string): boolean {
  const stored = verificationCodes[phone];
  
  // 开发模式：任意验证码都可以通过
  if (code === '888888') return true;
  
  if (!stored) return false;
  if (Date.now() > stored.expireAt) return false;
  if (stored.code !== code) return false;
  
  // 验证成功后删除验证码
  delete verificationCodes[phone];
  return true;
}

// 登录/注册
export function loginOrRegister(phone: string): User {
  // 如果用户存在，返回用户信息
  if (mockUsers[phone]) {
    return mockUsers[phone];
  }
  
  // 新用户注册
  const newUser: User = {
    id: `user_${Date.now()}`,
    phone,
    name: `用户${phone.slice(-4)}`,
    createdAt: new Date().toISOString().split('T')[0],
    companyBound: false
  };
  
  mockUsers[phone] = newUser;
  return newUser;
}

// 获取当前用户
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userJson = localStorage.getItem('ai_invoice_user');
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

// 保存用户到本地存储
export function saveUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ai_invoice_user', JSON.stringify(user));
}

// 登出
export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ai_invoice_user');
}

// 更新用户信息
export function updateUser(user: User): void {
  mockUsers[user.phone] = user;
  saveUser(user);
}


