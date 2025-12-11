// 用户认证系统 - 模拟实现

export interface User {
  id: string;
  phone: string;
  name: string;
  realName?: string;               // 实名认证后的真实姓名
  idCard?: string;                 // 身份证号（脱敏）
  avatar?: string;
  createdAt: string;
  verified: boolean;               // 是否已完成实名认证
  // 企业绑定状态
  companyBound: boolean;
  company?: CompanyInfo;
  // 名下关联企业列表（自然人认证后自动带出）
  relatedCompanies?: UserCompanyRelation[];
}

export interface CompanyInfo {
  // 基础工商信息
  name: string;                    // 企业名称
  creditCode: string;              // 统一社会信用代码
  legalPerson: string;             // 法定代表人
  registeredCapital: string;       // 注册资本
  establishDate: string;           // 成立日期
  businessStatus: string;          // 经营状态（存续/注销/吊销等）
  
  // 新增字段
  industry: string;                // 企业行业（所属行业）
  creditLevel: string;             // 信用等级（A/B/C/D）
  companyType: string;             // 企业类型（有限责任公司/股份有限公司等）
  taxAuthority: string;            // 所属税务机关
  
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

// 用户名下企业列表（自然人可能关联多个企业）
export interface UserCompanyRelation {
  companyName: string;
  creditCode: string;
  role: '法定代表人' | '股东' | '高管' | '财务负责人';
  bindTime?: string;
}

// 模拟用户数据库
const mockUsers: Record<string, User> = {
  '13800138000': {
    id: 'user_001',
    phone: '13800138000',
    name: '张总',
    realName: '张明',
    idCard: '440305****1234',
    createdAt: '2024-01-15',
    verified: true,
    companyBound: true,
    relatedCompanies: [
      { companyName: '深圳市智慧科技有限公司', creditCode: '91440300MA5XXXXXX', role: '法定代表人' },
      { companyName: '杭州云端网络科技有限公司', creditCode: '91330100MA2XXXXXX', role: '股东' },
    ],
    company: {
      name: '深圳市智慧科技有限公司',
      creditCode: '91440300MA5XXXXXX',
      legalPerson: '张明',
      registeredCapital: '500万人民币',
      establishDate: '2020-03-15',
      businessStatus: '存续',
      industry: '软件和信息技术服务业',
      creditLevel: 'A',
      companyType: '有限责任公司',
      taxAuthority: '国家税务总局深圳市南山区税务局',
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

// 自然人-企业关联模拟数据（模拟从税务系统获取）
export const mockPersonCompanyRelations: Record<string, UserCompanyRelation[]> = {
  '张明': [
    { companyName: '深圳市智慧科技有限公司', creditCode: '91440300MA5XXXXXX', role: '法定代表人' },
    { companyName: '杭州云端网络科技有限公司', creditCode: '91330100MA2XXXXXX', role: '股东' },
  ],
  '李华': [
    { companyName: '杭州云端网络科技有限公司', creditCode: '91330100MA2XXXXXX', role: '法定代表人' },
    { companyName: '上海智联贸易有限公司', creditCode: '91310115MA1XXXXXX', role: '股东' },
  ],
  '王芳': [
    { companyName: '上海智联贸易有限公司', creditCode: '91310115MA1XXXXXX', role: '法定代表人' },
  ],
  '陈医': [
    { companyName: '北京创新医疗科技有限公司', creditCode: '91110108MA0XXXXXX', role: '法定代表人' },
  ],
  '刘厨': [
    { companyName: '广州美食餐饮管理有限公司', creditCode: '91440106MA5XXXXXX', role: '法定代表人' },
  ],
};

// 模拟自然人认证（通过姓名+身份证）
export function verifyRealName(name: string, idCard: string): { 
  success: boolean; 
  message: string;
  relatedCompanies?: UserCompanyRelation[];
} {
  // 模拟实名认证成功，返回名下企业
  const companies = mockPersonCompanyRelations[name];
  
  if (companies && companies.length > 0) {
    return {
      success: true,
      message: '实名认证成功',
      relatedCompanies: companies
    };
  }
  
  // 默认返回一些演示企业
  return {
    success: true,
    message: '实名认证成功',
    relatedCompanies: [
      { companyName: '深圳市智慧科技有限公司', creditCode: '91440300MA5XXXXXX', role: '法定代表人' },
    ]
  };
}

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
    verified: false,
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



