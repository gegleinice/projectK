// 开票字段类型定义
export interface InvoiceFields {
  invoiceType: '普票' | '专票';  // 发票类型
  customerName: string;          // 收票方
  amount: number | null;         // 金额
  quantity: number | null;       // 数量
  unitPrice: number | null;      // 单价
  productType: string;           // 商品类型
}

export interface ParsedInvoice extends InvoiceFields {
  customerInfo?: {
    name: string;
    taxNumber: string;
    address: string;
    phone: string;
    bank: string;
    accountNumber: string;
  };
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;
  productName?: string;
  category?: string;
  invoiceNumber?: string;
  unit?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// 辅助函数：检查是否为槽位占位符
function isPlaceholder(value: string): boolean {
  return /^\[.*\]$/.test(value.trim());
}

// 自然语言解析函数
export function parseInvoiceRequest(input: string, defaultInvoiceType: '普票' | '专票' = '普票'): InvoiceFields {
  const fields: InvoiceFields = {
    invoiceType: defaultInvoiceType,
    customerName: '',
    amount: null,
    quantity: null,
    unitPrice: null,
    productType: ''
  };

  // 提取发票类型
  if (input.includes('专票') || input.includes('增值税专用发票')) {
    fields.invoiceType = '专票';
  } else if (input.includes('普票') || input.includes('增值税普通发票')) {
    fields.invoiceType = '普票';
  }

  // 提取客户名称
  const customerPatterns = [
    /(?:给|为)\s*([^\s，,开]+)(?:\s*开)/,
    /客户[:：]\s*([^\s，,]+)/,
    /收票方[:：]\s*([^\s，,]+)/
  ];
  
  for (const pattern of customerPatterns) {
    const match = input.match(pattern);
    if (match) {
      const extracted = match[1].trim();
      // 如果是槽位占位符，则不设置该字段
      if (!isPlaceholder(extracted)) {
        fields.customerName = extracted;
      }
      break;
    }
  }

  // 提取金额
  const amountPatterns = [
    /(?:金额|总[额价]|共计)[:：]?\s*(\d+(?:\.\d+)?)\s*元?/,
    /(\d+(?:\.\d+)?)\s*元/
  ];
  
  for (const pattern of amountPatterns) {
    const match = input.match(pattern);
    if (match) {
      fields.amount = parseFloat(match[1]);
      break;
    }
  }

  // 提取数量
  const quantityPatterns = [
    /数量[:：]?\s*(\d+)\s*[个件台份]?/,
    /(\d+)\s*[个件台份]/
  ];
  
  for (const pattern of quantityPatterns) {
    const match = input.match(pattern);
    if (match) {
      fields.quantity = parseInt(match[1]);
      break;
    }
  }

  // 提取单价
  const unitPricePatterns = [
    /单价[:：]?\s*(\d+(?:\.\d+)?)\s*元?/,
    /每[个件台份][:：]?\s*(\d+(?:\.\d+)?)\s*元?/
  ];
  
  for (const pattern of unitPricePatterns) {
    const match = input.match(pattern);
    if (match) {
      fields.unitPrice = parseFloat(match[1]);
      break;
    }
  }

  // 提取商品类型
  const productKeywords: Record<string, string[]> = {
    '软件服务': ['软件', '开发', '系统'],
    '技术服务': ['技术', '服务', 'IT'],
    '咨询服务': ['咨询', '顾问'],
    '云服务': ['云', '云平台', '云计算'],
    '电子产品': ['电脑', '笔记本', '手机'],
    '硬件设备': ['硬件', '设备', '服务器'],
    '办公用品': ['办公', '文具', '用品']
  };

  for (const [type, keywords] of Object.entries(productKeywords)) {
    if (keywords.some(keyword => input.includes(keyword))) {
      fields.productType = type;
      break;
    }
  }

  return fields;
}

// 逻辑校验函数
export function validateInvoiceLogic(fields: InvoiceFields): ValidationError[] {
  const errors: ValidationError[] = [];

  // 检查必填字段
  if (!fields.customerName) {
    errors.push({ field: 'customerName', message: '缺少客户名称' });
  }

  // 检查数学逻辑: 数量 × 单价 = 金额
  if (fields.quantity !== null && fields.unitPrice !== null && fields.amount !== null) {
    const calculated = fields.quantity * fields.unitPrice;
    const diff = Math.abs(calculated - fields.amount);
    
    // 允许0.01的误差（浮点数精度）
    if (diff > 0.01) {
      errors.push({
        field: 'calculation',
        message: `逻辑校验不通过：${fields.quantity} × ${fields.unitPrice} = ${calculated} ≠ ${fields.amount}，请修正`
      });
    }
  }

  // 如果只提供了两个值，自动计算第三个
  if (fields.quantity !== null && fields.unitPrice !== null && fields.amount === null) {
    // 自动计算金额
  } else if (fields.quantity !== null && fields.amount !== null && fields.unitPrice === null) {
    // 自动计算单价
  } else if (fields.unitPrice !== null && fields.amount !== null && fields.quantity === null) {
    // 自动计算数量
  }

  return errors;
}

// 智能补全函数
export function smartComplete(fields: InvoiceFields, mockCustomers: any, productTypes: any, templates: any[]): ParsedInvoice {
  const result: ParsedInvoice = { ...fields };

  // 1. 客户信息补全
  for (const [key, customer] of Object.entries(mockCustomers)) {
    if (fields.customerName.includes(key)) {
      result.customerInfo = customer as any;
      break;
    }
  }

  // 2. 税率匹配
  if (fields.productType && productTypes[fields.productType]) {
    const product = productTypes[fields.productType];
    result.taxRate = product.taxRate;
    result.productName = product.name;
    result.category = product.category;
  }

  // 3. 自动计算缺失的金额参数
  if (fields.quantity !== null && fields.unitPrice !== null && fields.amount === null) {
    result.amount = fields.quantity * fields.unitPrice;
  } else if (fields.quantity !== null && fields.amount !== null && fields.unitPrice === null) {
    result.unitPrice = fields.amount / fields.quantity;
  } else if (fields.unitPrice !== null && fields.amount !== null && fields.quantity === null) {
    result.quantity = fields.amount / fields.unitPrice;
  }

  // 4. 计算税额和总额
  if (result.amount !== null && result.taxRate) {
    result.taxAmount = result.amount * (result.taxRate / 100);
    result.totalAmount = result.amount + result.taxAmount;
  }

  // 5. 模板调用 - 根据历史习惯补全单价
  if (fields.unitPrice === null) {
    const template = templates.find(
      t => result.customerInfo?.name.includes(t.customerName) && 
           t.productType === fields.productType
    );
    if (template?.commonUnitPrice) {
      result.unitPrice = template.commonUnitPrice;
      if (result.quantity !== null && result.unitPrice !== null) {
        result.amount = result.quantity * result.unitPrice;
      }
    }
  }

  return result;
}


