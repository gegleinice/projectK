// 开票设置 - 项目信息与客户信息维护

// 项目信息接口
export interface ProjectItem {
  id: string;
  name: string;                    // 项目名称
  taxCode: string;                 // 税收分类编码
  specification: string;           // 规格型号
  unit: string;                    // 单位
  unitPrice: number;               // 单价
  taxRate: number;                 // 税率 (%)
  category: string;                // 商品类别
  createdAt: string;
  updatedAt: string;
}

// 客户信息接口
export interface CustomerItem {
  id: string;
  name: string;                    // 客户名称
  taxNumber: string;               // 纳税人识别号
  address: string;                 // 地址
  phone: string;                   // 电话
  bankName: string;                // 开户银行
  bankAccount: string;             // 银行账号
  remark: string;                  // 备注
  createdAt: string;
  updatedAt: string;
}

// 存储键名
const PROJECTS_STORAGE_KEY = 'ai_invoice_projects';
const CUSTOMERS_STORAGE_KEY = 'ai_invoice_customers';

// 默认项目数据
const defaultProjects: ProjectItem[] = [
  {
    id: '1',
    name: '软件技术服务',
    taxCode: '3040201',
    specification: '-',
    unit: '次',
    unitPrice: 10000,
    taxRate: 6,
    category: '现代服务',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  },
  {
    id: '2',
    name: '信息技术咨询服务',
    taxCode: '3040202',
    specification: '-',
    unit: '项',
    unitPrice: 5000,
    taxRate: 6,
    category: '现代服务',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  },
  {
    id: '3',
    name: '云计算服务',
    taxCode: '3040203',
    specification: '-',
    unit: '月',
    unitPrice: 8000,
    taxRate: 6,
    category: '现代服务',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  },
  {
    id: '4',
    name: '电子设备',
    taxCode: '1090101',
    specification: '标准版',
    unit: '台',
    unitPrice: 15000,
    taxRate: 13,
    category: '电子产品',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  },
  {
    id: '5',
    name: '办公用品',
    taxCode: '1060101',
    specification: '-',
    unit: '批',
    unitPrice: 500,
    taxRate: 13,
    category: '日用品',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  }
];

// 默认客户数据
const defaultCustomers: CustomerItem[] = [
  {
    id: '1',
    name: '深圳市腾讯计算机系统有限公司',
    taxNumber: '91440300708461136T',
    address: '广东省深圳市南山区粤海街道麻岭社区科技中一路腾讯大厦',
    phone: '0755-86013388',
    bankName: '中国工商银行深圳深港支行',
    bankAccount: '4000029109200072935',
    remark: 'VIP客户',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  },
  {
    id: '2',
    name: '华为技术有限公司',
    taxNumber: '91440300279776128U',
    address: '广东省深圳市龙岗区坂田街道华为基地',
    phone: '0755-28780808',
    bankName: '中国银行深圳高新区支行',
    bankAccount: '755923688810001',
    remark: '',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  },
  {
    id: '3',
    name: '阿里巴巴（中国）有限公司',
    taxNumber: '91330100799655058B',
    address: '浙江省杭州市余杭区文一西路969号',
    phone: '0571-85022088',
    bankName: '招商银行杭州分行',
    bankAccount: '571908888810601',
    remark: '',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  },
  {
    id: '4',
    name: '北京字节跳动科技有限公司',
    taxNumber: '91110108MA001U5G7Q',
    address: '北京市海淀区知春路甲48号方正国际大厦',
    phone: '010-58022666',
    bankName: '招商银行北京分行清华园支行',
    bankAccount: '110914288210802',
    remark: '',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01'
  }
];

// 获取项目列表
export function getProjects(): ProjectItem[] {
  if (typeof window === 'undefined') return defaultProjects;
  
  const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (!stored) {
    // 初始化默认数据
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(defaultProjects));
    return defaultProjects;
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return defaultProjects;
  }
}

// 保存项目列表
export function saveProjects(projects: ProjectItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

// 添加项目
export function addProject(project: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt'>): ProjectItem {
  const projects = getProjects();
  const newProject: ProjectItem = {
    ...project,
    id: Date.now().toString(),
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };
  projects.push(newProject);
  saveProjects(projects);
  return newProject;
}

// 更新项目
export function updateProject(id: string, updates: Partial<ProjectItem>): ProjectItem | null {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: new Date().toISOString().split('T')[0]
  };
  saveProjects(projects);
  return projects[index];
}

// 删除项目
export function deleteProject(id: string): boolean {
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== id);
  if (filtered.length === projects.length) return false;
  saveProjects(filtered);
  return true;
}

// 搜索项目
export function searchProjects(keyword: string, limit: number = 5): ProjectItem[] {
  const projects = getProjects();
  if (!keyword) return projects.slice(0, limit);
  
  const lowerKeyword = keyword.toLowerCase();
  return projects
    .filter(p => 
      p.name.toLowerCase().includes(lowerKeyword) ||
      p.category.toLowerCase().includes(lowerKeyword) ||
      p.taxCode.includes(keyword)
    )
    .slice(0, limit);
}

// 获取客户列表
export function getCustomers(): CustomerItem[] {
  if (typeof window === 'undefined') return defaultCustomers;
  
  const stored = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
  if (!stored) {
    // 初始化默认数据
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(defaultCustomers));
    return defaultCustomers;
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return defaultCustomers;
  }
}

// 保存客户列表
export function saveCustomers(customers: CustomerItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
}

// 添加客户
export function addCustomer(customer: Omit<CustomerItem, 'id' | 'createdAt' | 'updatedAt'>): CustomerItem {
  const customers = getCustomers();
  const newCustomer: CustomerItem = {
    ...customer,
    id: Date.now().toString(),
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };
  customers.push(newCustomer);
  saveCustomers(customers);
  return newCustomer;
}

// 更新客户
export function updateCustomer(id: string, updates: Partial<CustomerItem>): CustomerItem | null {
  const customers = getCustomers();
  const index = customers.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  customers[index] = {
    ...customers[index],
    ...updates,
    updatedAt: new Date().toISOString().split('T')[0]
  };
  saveCustomers(customers);
  return customers[index];
}

// 删除客户
export function deleteCustomer(id: string): boolean {
  const customers = getCustomers();
  const filtered = customers.filter(c => c.id !== id);
  if (filtered.length === customers.length) return false;
  saveCustomers(filtered);
  return true;
}

// 搜索客户
export function searchCustomers(keyword: string, limit: number = 5): CustomerItem[] {
  const customers = getCustomers();
  if (!keyword) return customers.slice(0, limit);
  
  const lowerKeyword = keyword.toLowerCase();
  return customers
    .filter(c => 
      c.name.toLowerCase().includes(lowerKeyword) ||
      c.taxNumber.includes(keyword)
    )
    .slice(0, limit);
}

// 根据名称查找客户（精确匹配或模糊匹配）
export function findCustomerByName(name: string): CustomerItem | undefined {
  const customers = getCustomers();
  // 先尝试精确匹配
  let found = customers.find(c => c.name === name);
  if (found) return found;
  
  // 模糊匹配
  const lowerName = name.toLowerCase();
  return customers.find(c => 
    c.name.toLowerCase().includes(lowerName) || 
    lowerName.includes(c.name.toLowerCase().replace(/有限公司|股份有限公司|集团/g, ''))
  );
}

// 根据名称查找项目（精确匹配或模糊匹配）
export function findProjectByName(name: string): ProjectItem | undefined {
  const projects = getProjects();
  // 先尝试精确匹配
  let found = projects.find(p => p.name === name);
  if (found) return found;
  
  // 模糊匹配
  const lowerName = name.toLowerCase();
  return projects.find(p => 
    p.name.toLowerCase().includes(lowerName) || 
    lowerName.includes(p.name.toLowerCase())
  );
}

