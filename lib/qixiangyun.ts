// 企享云 API 模拟 - 工商信息查询服务

import { CompanyInfo } from './auth';

// 模拟企业数据库（按企业名称或信用代码查询）- 包含完整工商+税务信息
const companyDatabase: Record<string, Partial<CompanyInfo>> = {
  '深圳市智慧科技有限公司': {
    name: '深圳市智慧科技有限公司',
    creditCode: '91440300MA5XXXXXX',
    legalPerson: '张明',
    registeredCapital: '500万人民币',
    establishDate: '2020-03-15',
    businessStatus: '存续',
    // 新增字段
    industry: '软件和信息技术服务业',
    creditLevel: 'A',
    companyType: '有限责任公司(自然人投资或控股)',
    taxAuthority: '国家税务总局深圳市南山区税务局',
    // 原有字段
    registeredAddress: '深圳市南山区科技园南区科苑路15号',
    province: '广东省',
    city: '深圳市',
    district: '南山区',
    businessScope: '软件开发；信息技术咨询服务；计算机系统服务；数据处理和存储服务；人工智能应用软件开发；云计算装备技术服务',
    industryCategory: '信息传输、软件和信息技术服务业',
  },
  '杭州云端网络科技有限公司': {
    name: '杭州云端网络科技有限公司',
    creditCode: '91330100MA2XXXXXX',
    legalPerson: '李华',
    registeredCapital: '1000万人民币',
    establishDate: '2018-06-20',
    businessStatus: '存续',
    industry: '互联网和相关服务业',
    creditLevel: 'A',
    companyType: '有限责任公司(自然人投资或控股)',
    taxAuthority: '国家税务总局杭州市余杭区税务局',
    registeredAddress: '杭州市余杭区文一西路998号未来科技城',
    province: '浙江省',
    city: '杭州市',
    district: '余杭区',
    businessScope: '网络技术开发；电子商务平台运营；互联网信息服务；软件开发与销售',
    industryCategory: '信息传输、软件和信息技术服务业',
  },
  '上海智联贸易有限公司': {
    name: '上海智联贸易有限公司',
    creditCode: '91310115MA1XXXXXX',
    legalPerson: '王芳',
    registeredCapital: '200万人民币',
    establishDate: '2019-09-10',
    businessStatus: '存续',
    industry: '批发业',
    creditLevel: 'B',
    companyType: '有限责任公司(自然人独资)',
    taxAuthority: '国家税务总局上海市浦东新区税务局',
    registeredAddress: '上海市浦东新区张江高科技园区博云路2号',
    province: '上海市',
    city: '上海市',
    district: '浦东新区',
    businessScope: '货物进出口；技术进出口；代理进出口；批发零售：电子产品、办公用品、日用百货',
    industryCategory: '批发和零售业',
  },
  '北京创新医疗科技有限公司': {
    name: '北京创新医疗科技有限公司',
    creditCode: '91110108MA0XXXXXX',
    legalPerson: '陈医',
    registeredCapital: '2000万人民币',
    establishDate: '2017-04-08',
    businessStatus: '存续',
    industry: '研究和试验发展',
    creditLevel: 'A',
    companyType: '有限责任公司(自然人投资或控股)',
    taxAuthority: '国家税务总局北京市海淀区税务局',
    registeredAddress: '北京市海淀区中关村东路66号世纪科贸大厦',
    province: '北京市',
    city: '北京市',
    district: '海淀区',
    businessScope: '医疗器械研发与销售；医疗软件开发；健康咨询服务；医疗技术推广',
    industryCategory: '科学研究和技术服务业',
  },
  '广州美食餐饮管理有限公司': {
    name: '广州美食餐饮管理有限公司',
    creditCode: '91440106MA5XXXXXX',
    legalPerson: '刘厨',
    registeredCapital: '100万人民币',
    establishDate: '2021-02-28',
    businessStatus: '存续',
    industry: '餐饮业',
    creditLevel: 'B',
    companyType: '有限责任公司(自然人独资)',
    taxAuthority: '国家税务总局广州市天河区税务局',
    registeredAddress: '广州市天河区天河路385号太古汇',
    province: '广东省',
    city: '广州市',
    district: '天河区',
    businessScope: '餐饮服务；餐饮管理；食品加工；餐饮连锁经营',
    industryCategory: '住宿和餐饮业',
  }
};

// 企享云查询结果
export interface QixiangyunResult {
  success: boolean;
  message: string;
  data?: Partial<CompanyInfo>;
}

// 模拟 API 延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 搜索企业（模糊匹配）
export async function searchCompany(keyword: string): Promise<{ success: boolean; results: string[] }> {
  await delay(500); // 模拟网络延迟
  
  const results = Object.keys(companyDatabase).filter(name =>
    name.includes(keyword) || companyDatabase[name].creditCode?.includes(keyword)
  );
  
  return {
    success: true,
    results
  };
}

// 获取企业详细信息
export async function getCompanyInfo(companyName: string): Promise<QixiangyunResult> {
  await delay(800); // 模拟网络延迟
  
  const company = companyDatabase[companyName];
  
  if (!company) {
    return {
      success: false,
      message: '未找到该企业信息，请检查企业名称是否正确'
    };
  }
  
  return {
    success: true,
    message: '获取成功',
    data: company
  };
}

// 智能解析主营业务（从经营范围中提取）
export function parseMainBusiness(businessScope: string): string[] {
  // 关键词提取规则
  const keywords = [
    '软件开发', '信息技术咨询', '云计算', 'AI', '人工智能',
    '电子商务', '网络技术', '数据处理', '系统集成',
    '货物进出口', '技术进出口', '批发零售',
    '医疗器械', '医疗软件', '健康咨询',
    '餐饮服务', '餐饮管理', '食品加工',
    '教育培训', '咨询服务', '广告设计',
    '建筑工程', '装修装饰', '房地产'
  ];
  
  const found = keywords.filter(keyword => businessScope.includes(keyword));
  
  // 如果没有匹配到，从经营范围中提取前几个业务
  if (found.length === 0) {
    const items = businessScope.split(/[；;，,]/).filter(item => item.trim().length > 0);
    return items.slice(0, 4).map(item => item.trim().substring(0, 10));
  }
  
  return found.slice(0, 5);
}

// 根据注册地址推测开票地
export function inferInvoiceLocation(address: string, province: string, city: string): {
  invoiceProvince: string;
  invoiceCity: string;
  taxAuthority: string;
  recommendation: string;
} {
  // 税务机关推测
  let taxAuthority = '';
  let recommendation = '';
  
  // 直辖市特殊处理
  if (['北京市', '上海市', '天津市', '重庆市'].includes(province)) {
    taxAuthority = `${province}税务局`;
    recommendation = `建议在${province}申领发票，可享受直辖市便捷税务服务`;
  } else {
    taxAuthority = `${province}${city}税务局`;
    recommendation = `建议在${city}本地税务机关申领发票，便于属地管理`;
  }
  
  // 特殊区域提示
  if (address.includes('自贸区') || address.includes('保税区')) {
    recommendation += '；您的企业位于特殊监管区域，可能享受税收优惠政策';
  }
  
  if (address.includes('高新区') || address.includes('科技园')) {
    recommendation += '；高新技术企业可申请研发费用加计扣除';
  }
  
  return {
    invoiceProvince: province,
    invoiceCity: city,
    taxAuthority,
    recommendation
  };
}

// 根据行业类别推荐税率
export function getRecommendedTaxRate(industryCategory: string): {
  defaultRate: number;
  rateOptions: { rate: number; description: string }[];
} {
  const industryRates: Record<string, { defaultRate: number; rateOptions: { rate: number; description: string }[] }> = {
    '信息传输、软件和信息技术服务业': {
      defaultRate: 6,
      rateOptions: [
        { rate: 6, description: '现代服务业标准税率' },
        { rate: 13, description: '销售软件产品（含载体）' },
        { rate: 0, description: '出口服务免税' }
      ]
    },
    '批发和零售业': {
      defaultRate: 13,
      rateOptions: [
        { rate: 13, description: '一般货物销售' },
        { rate: 9, description: '农产品等特定货物' },
        { rate: 0, description: '出口货物免税' }
      ]
    },
    '科学研究和技术服务业': {
      defaultRate: 6,
      rateOptions: [
        { rate: 6, description: '技术服务、咨询服务' },
        { rate: 13, description: '销售研发产品' }
      ]
    },
    '住宿和餐饮业': {
      defaultRate: 6,
      rateOptions: [
        { rate: 6, description: '餐饮服务' },
        { rate: 13, description: '外卖食品销售' }
      ]
    }
  };
  
  return industryRates[industryCategory] || {
    defaultRate: 6,
    rateOptions: [
      { rate: 6, description: '服务业' },
      { rate: 9, description: '建筑、交通等' },
      { rate: 13, description: '货物销售' }
    ]
  };
}

// 完整的企业绑定流程
export async function bindCompany(companyName: string): Promise<{
  success: boolean;
  message: string;
  companyInfo?: CompanyInfo;
}> {
  // 1. 获取基础工商信息
  const result = await getCompanyInfo(companyName);
  
  if (!result.success || !result.data) {
    return {
      success: false,
      message: result.message
    };
  }
  
  const baseInfo = result.data;
  
  // 2. 解析主营业务
  const mainBusiness = parseMainBusiness(baseInfo.businessScope || '');
  
  // 3. 推测开票地
  const invoiceLocation = inferInvoiceLocation(
    baseInfo.registeredAddress || '',
    baseInfo.province || '',
    baseInfo.city || ''
  );
  
  // 4. 获取推荐税率
  const taxInfo = getRecommendedTaxRate(baseInfo.industryCategory || '');
  
  // 5. 组装完整的企业信息
  const companyInfo: CompanyInfo = {
    name: baseInfo.name || '',
    creditCode: baseInfo.creditCode || '',
    legalPerson: baseInfo.legalPerson || '',
    registeredCapital: baseInfo.registeredCapital || '',
    establishDate: baseInfo.establishDate || '',
    businessStatus: baseInfo.businessStatus || '',
    // 新增字段
    industry: baseInfo.industry || baseInfo.industryCategory || '',
    creditLevel: baseInfo.creditLevel || 'B',
    companyType: baseInfo.companyType || '有限责任公司',
    taxAuthority: baseInfo.taxAuthority || invoiceLocation.taxAuthority,
    // 原有字段
    registeredAddress: baseInfo.registeredAddress || '',
    province: baseInfo.province || '',
    city: baseInfo.city || '',
    district: baseInfo.district || '',
    businessScope: baseInfo.businessScope || '',
    mainBusiness,
    industryCategory: baseInfo.industryCategory || '',
    invoiceAddress: baseInfo.registeredAddress || '',
    invoicePhone: '',
    bankName: '',
    bankAccount: '',
    taxType: '一般纳税人',
    invoiceQuota: 5000000
  };
  
  return {
    success: true,
    message: '企业绑定成功',
    companyInfo
  };
}



