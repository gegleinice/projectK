// 客户信息管理
import { getQixiangyunService } from './qixiangyunService';

/** 客户信息 */
export interface CustomerData {
  id?: string;
  name: string;              // 客户名称
  taxNumber?: string;        // 纳税识别号
  address?: string;          // 地址
  phone?: string;            // 电话
  bankName?: string;         // 开户银行
  bankAccount?: string;      // 银行账号
  category?: string;         // 客户分类
  remark?: string;           // 备注
}

// 模拟客户数据库
const mockCustomers: Record<string, CustomerData> = {
  '腾讯': {
    name: '深圳市腾讯计算机系统有限公司',
    taxNumber: '914403001234567890',
    address: '深圳市南山区科技园',
    phone: '0755-86013388',
    bankName: '招商银行深圳分行',
    bankAccount: '755912345678901234',
    category: '互联网企业'
  },
  '阿里': {
    name: '阿里巴巴（中国）有限公司',
    taxNumber: '913301001234567891',
    address: '杭州市余杭区文一西路969号',
    phone: '0571-85022088',
    bankName: '中国工商银行杭州市分行',
    bankAccount: '330912345678901234',
    category: '互联网企业'
  },
  '华为': {
    name: '华为技术有限公司',
    taxNumber: '914403001234567892',
    address: '深圳市龙岗区坂田华为基地',
    phone: '0755-28780808',
    bankName: '中国银行深圳分行',
    bankAccount: '755812345678901234',
    category: '科技企业'
  }
};

// 是否使用真实API
const useRealAPI = typeof process !== 'undefined' && 
  process.env.NEXT_PUBLIC_QIXIANGYUN_APP_KEY && 
  process.env.NEXT_PUBLIC_QIXIANGYUN_APP_SECRET;

/**
 * 获取当前用户企业信息
 */
function getCurrentCompanyInfo(): { creditCode: string; areaCode: string } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('ai_invoice_user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    if (!user.company || !user.company.creditCode) return null;
    
    let areaCode = '11'; // 默认北京
    if (user.company.province?.includes('广东')) areaCode = '44';
    if (user.company.province?.includes('浙江')) areaCode = '33';
    if (user.company.province?.includes('上海')) areaCode = '31';
    
    return {
      creditCode: user.company.creditCode,
      areaCode
    };
  } catch {
    return null;
  }
}

/**
 * 搜索客户
 */
export async function searchCustomers(keyword: string): Promise<CustomerData[]> {
  // 尝试使用真实API
  if (useRealAPI) {
    try {
      const companyInfo = getCurrentCompanyInfo();
      if (companyInfo) {
        const service = getQixiangyunService();
        const customers = await service.queryCustomers(
          companyInfo.creditCode,
          companyInfo.areaCode,
          keyword
        );
        
        // 转换为本地格式
        return customers.map(c => ({
          id: c.id,
          name: c.gfmc,
          taxNumber: c.gfnsrsbh,
          address: c.gfdz,
          phone: c.gfdh,
          bankName: c.gfkhh,
          bankAccount: c.gfzh,
          category: c.khfl
        }));
      }
    } catch (error) {
      console.error('Real API search customers failed:', error);
    }
  }
  
  // 回退到模拟数据
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (!keyword) {
    return Object.values(mockCustomers);
  }
  
  return Object.values(mockCustomers).filter(c =>
    c.name.includes(keyword) || c.taxNumber?.includes(keyword)
  );
}

/**
 * 根据名称获取客户详情
 */
export async function getCustomerByName(name: string): Promise<CustomerData | null> {
  // 模糊匹配
  for (const [key, customer] of Object.entries(mockCustomers)) {
    if (name.includes(key) || customer.name.includes(name)) {
      return customer;
    }
  }
  
  return null;
}

/**
 * 添加客户
 */
export async function addCustomer(customer: CustomerData): Promise<boolean> {
  if (useRealAPI) {
    try {
      const companyInfo = getCurrentCompanyInfo();
      if (companyInfo) {
        const service = getQixiangyunService();
        await service.addCustomer(
          companyInfo.creditCode,
          companyInfo.areaCode,
          {
            gfmc: customer.name,
            gfnsrsbh: customer.taxNumber,
            gfdz: customer.address,
            gfdh: customer.phone,
            gfkhh: customer.bankName,
            gfzh: customer.bankAccount,
            khfl: customer.category
          }
        );
        return true;
      }
    } catch (error) {
      console.error('Real API add customer failed:', error);
    }
  }
  
  // 模拟添加
  mockCustomers[customer.name] = customer;
  return true;
}

/**
 * 更新客户
 */
export async function updateCustomer(customer: CustomerData): Promise<boolean> {
  if (useRealAPI) {
    try {
      const companyInfo = getCurrentCompanyInfo();
      if (companyInfo && customer.id) {
        const service = getQixiangyunService();
        await service.updateCustomer(
          companyInfo.creditCode,
          companyInfo.areaCode,
          {
            id: customer.id,
            gfmc: customer.name,
            gfnsrsbh: customer.taxNumber,
            gfdz: customer.address,
            gfdh: customer.phone,
            gfkhh: customer.bankName,
            gfzh: customer.bankAccount,
            khfl: customer.category
          }
        );
        return true;
      }
    } catch (error) {
      console.error('Real API update customer failed:', error);
    }
  }
  
  // 模拟更新
  if (customer.name) {
    mockCustomers[customer.name] = customer;
  }
  return true;
}

/**
 * 删除客户
 */
export async function deleteCustomer(customerId: string): Promise<boolean> {
  if (useRealAPI) {
    try {
      const companyInfo = getCurrentCompanyInfo();
      if (companyInfo) {
        const service = getQixiangyunService();
        await service.deleteCustomer(
          companyInfo.creditCode,
          companyInfo.areaCode,
          customerId
        );
        return true;
      }
    } catch (error) {
      console.error('Real API delete customer failed:', error);
    }
  }
  
  // 模拟删除
  for (const key of Object.keys(mockCustomers)) {
    if (mockCustomers[key].id === customerId) {
      delete mockCustomers[key];
      return true;
    }
  }
  return false;
}

