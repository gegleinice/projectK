import { getCustomers, CustomerItem } from './invoiceSettings';

// Mock客户数据库
export interface CustomerInfo {
  name: string;
  taxNumber: string;
  address: string;
  phone: string;
  bank: string;
  accountNumber: string;
  isUserDefined?: boolean;
}

export const mockCustomers: Record<string, CustomerInfo> = {
  '腾讯': {
    name: '深圳市腾讯计算机系统有限公司',
    taxNumber: '91440300708461136T',
    address: '广东省深圳市南山区粤海街道麻岭社区科技中一路腾讯大厦',
    phone: '0755-86013388',
    bank: '中国工商银行深圳深港支行',
    accountNumber: '4000029109200072935'
  },
  '阿里': {
    name: '阿里巴巴(中国)有限公司',
    taxNumber: '913301087254843425',
    address: '浙江省杭州市余杭区五常街道文一西路969号',
    phone: '0571-85022088',
    bank: '中国工商银行杭州东新支行',
    accountNumber: '1202020119024907935'
  },
  '字节': {
    name: '北京字节跳动科技有限公司',
    taxNumber: '91110108MAOO1KFQ8R',
    address: '北京市海淀区知春路甲48号3号楼14A层',
    phone: '010-82800000',
    bank: '中国银行北京分行',
    accountNumber: '3428210103002451092'
  },
  '华为': {
    name: '华为技术有限公司',
    taxNumber: '914403001922038216',
    address: '广东省深圳市龙岗区坂田华为总部办公楼',
    phone: '0755-28780808',
    bank: '中国工商银行深圳分行',
    accountNumber: '4000024019200033986'
  }
};

// 商品类型与税率映射
export interface ProductType {
  name: string;
  taxRate: number;
  category: string;
}

export const productTypes: Record<string, ProductType> = {
  '软件服务': { name: '软件技术服务', taxRate: 6, category: '现代服务' },
  '技术服务': { name: '信息技术服务', taxRate: 6, category: '现代服务' },
  '咨询服务': { name: '咨询服务', taxRate: 6, category: '现代服务' },
  '云服务': { name: '云计算服务', taxRate: 6, category: '现代服务' },
  '电子产品': { name: '计算机及配件', taxRate: 13, category: '货物销售' },
  '硬件设备': { name: '电子设备', taxRate: 13, category: '货物销售' },
  '办公用品': { name: '办公用品', taxRate: 13, category: '货物销售' }
};

// 历史开票模板
export interface InvoiceTemplate {
  customerName: string;
  productType: string;
  commonUnitPrice?: number;
  notes?: string;
}

export const invoiceTemplates: InvoiceTemplate[] = [
  {
    customerName: '腾讯',
    productType: '软件服务',
    commonUnitPrice: 10000,
    notes: '项目开发服务'
  },
  {
    customerName: '阿里',
    productType: '云服务',
    commonUnitPrice: 5000,
    notes: '云平台技术支持'
  },
  {
    customerName: '字节',
    productType: '技术服务',
    commonUnitPrice: 15000,
    notes: 'AI算法开发'
  }
];

/**
 * 将用户维护的客户转换为CustomerInfo格式
 */
function customerItemToInfo(item: CustomerItem): CustomerInfo {
  return {
    name: item.name,
    taxNumber: item.taxNumber,
    address: item.address,
    phone: item.phone,
    bank: item.bankName,
    accountNumber: item.bankAccount,
    isUserDefined: true
  };
}

/**
 * 获取所有客户（用户维护的优先）
 * 返回合并后的客户字典，key为客户简称
 */
export function getAllCustomers(): Record<string, CustomerInfo> {
  const result: Record<string, CustomerInfo> = { ...mockCustomers };
  
  try {
    const userCustomers = getCustomers();
    for (const customer of userCustomers) {
      // 生成简称（取公司名称的关键词）
      let shortName = customer.name
        .replace(/有限公司|股份有限公司|集团|（中国）|（深圳）|（北京）|（上海）/g, '')
        .replace(/深圳市|北京|上海|广州|杭州/g, '')
        .trim();
      
      // 如果简称太长，取前几个字
      if (shortName.length > 6) {
        shortName = shortName.substring(0, 4);
      }
      
      result[shortName] = customerItemToInfo(customer);
      // 同时用全称作为key
      result[customer.name] = customerItemToInfo(customer);
    }
  } catch {
    // 在服务端渲染时忽略localStorage访问错误
  }
  
  return result;
}

/**
 * 根据客户名称查找客户信息（支持模糊匹配）
 */
export function findCustomer(name: string): CustomerInfo | undefined {
  const allCustomers = getAllCustomers();
  
  // 精确匹配
  if (allCustomers[name]) {
    return allCustomers[name];
  }
  
  // 模糊匹配
  const lowerName = name.toLowerCase();
  for (const [key, customer] of Object.entries(allCustomers)) {
    if (key.toLowerCase().includes(lowerName) || 
        customer.name.toLowerCase().includes(lowerName) ||
        lowerName.includes(key.toLowerCase())) {
      return customer;
    }
  }
  
  return undefined;
}


