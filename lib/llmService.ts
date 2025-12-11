// 大模型服务 - 发票信息解析

// 解析结果接口
export interface ParsedInvoiceResult {
  invoiceType: '普票' | '专票';
  customerName: string | null;
  productType: string | null;
  amount: number | null;
  quantity: number | null;
  unitPrice: number | null;
  confidence: number;
  missing: string[];
  clarification: string | null;
}

// System Prompt - 发票信息解析
export const INVOICE_PARSE_SYSTEM_PROMPT = `你是一个专业的发票信息解析助手。请从用户的自然语言描述中准确提取开票信息。

提取规则：
1. 发票类型：识别"普票/普通发票"或"专票/专用发票"，默认为"普票"
2. 客户名称：识别购买方/客户/收票方名称（如：腾讯、华为、阿里巴巴等）
3. 商品/服务：识别开票的商品或服务内容（如：软件服务、技术咨询、云计算等）
4. 金额：识别总金额（单位：元），注意"万"="10000"
5. 数量：识别商品/服务数量
6. 单价：识别单价（单位：元）

输出格式（严格JSON，不要添加任何其他文字）：
{
  "invoiceType": "普票" 或 "专票",
  "customerName": "客户名称" 或 null,
  "productType": "商品/服务名称" 或 null,
  "amount": 数字或null,
  "quantity": 数字或null,
  "unitPrice": 数字或null,
  "confidence": 0到100的置信度数字,
  "missing": ["缺失的字段名称数组"],
  "clarification": "如有歧义需要澄清的问题" 或 null
}

注意：
- 金额、数量、单价如未明确提及返回null
- 如果信息不完整，在missing中列出缺失字段（可选值：customerName, productType, amount, quantity, unitPrice）
- 如有歧义，在clarification中提出一个简短的澄清问题
- 置信度评估：信息越完整越高，70以上为可直接使用，50-70需要补充，50以下信息不足
- 只返回JSON，不要有任何额外说明文字`;

// API 配置
export const LLM_CONFIG = {
  apiKey: 'sk_n8oWVzrnV4kJsZa0esi9V69i19Ir9DuVPPN-KON1g_A',
  baseUrl: 'https://api.jiekou.ai/openai',
  model: 'deepseek/deepseek-v3.1',
  maxTokens: 1024,
  temperature: 0.3 // 低温度保证输出稳定性
};

// 解析发票信息（客户端调用API Route）
export async function parseInvoiceWithLLM(userInput: string): Promise<ParsedInvoiceResult> {
  try {
    const response = await fetch('/api/parse-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInput }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('LLM解析失败:', error);
    // 返回默认结果
    return {
      invoiceType: '普票',
      customerName: null,
      productType: null,
      amount: null,
      quantity: null,
      unitPrice: null,
      confidence: 0,
      missing: ['customerName', 'productType', 'amount'],
      clarification: '抱歉，解析失败，请重新描述您的开票需求'
    };
  }
}

// 从LLM响应中提取JSON
export function extractJsonFromResponse(response: string): ParsedInvoiceResult | null {
  try {
    // 尝试直接解析
    const parsed = JSON.parse(response);
    return validateAndNormalize(parsed);
  } catch {
    // 尝试提取JSON块
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return validateAndNormalize(parsed);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// 验证并规范化解析结果
function validateAndNormalize(parsed: any): ParsedInvoiceResult {
  return {
    invoiceType: parsed.invoiceType === '专票' ? '专票' : '普票',
    customerName: typeof parsed.customerName === 'string' ? parsed.customerName : null,
    productType: typeof parsed.productType === 'string' ? parsed.productType : null,
    amount: typeof parsed.amount === 'number' ? parsed.amount : null,
    quantity: typeof parsed.quantity === 'number' ? parsed.quantity : null,
    unitPrice: typeof parsed.unitPrice === 'number' ? parsed.unitPrice : null,
    confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 50,
    missing: Array.isArray(parsed.missing) ? parsed.missing : [],
    clarification: typeof parsed.clarification === 'string' ? parsed.clarification : null
  };
}

// 生成结构化的解析结果数据（用于卡片渲染）
export interface ParseResultDisplay {
  invoiceType: string;
  customerName?: string;
  productType?: string;
  amount?: number;
  quantity?: number;
  unitPrice?: number;
  missingRequired: string[];  // 必填缺失
  missingOptional: string[];  // 可选缺失（将自动填充）
  clarification?: string;
  confidence: number;
  canProceed: boolean;  // 是否可以继续流程
}

// 必填字段定义
const REQUIRED_FIELDS = ['customerName', 'productType', 'amount'];
const OPTIONAL_FIELDS = ['quantity', 'unitPrice'];

const FIELD_NAMES: Record<string, string> = {
  customerName: '客户名称',
  productType: '商品/服务',
  amount: '金额',
  quantity: '数量',
  unitPrice: '单价'
};

// 转换为显示数据
export function toDisplayResult(result: ParsedInvoiceResult): ParseResultDisplay {
  // 检查必填字段缺失
  const missingRequired: string[] = [];
  if (!result.customerName) missingRequired.push(FIELD_NAMES.customerName);
  if (!result.productType) missingRequired.push(FIELD_NAMES.productType);
  if (result.amount === null) missingRequired.push(FIELD_NAMES.amount);
  
  // 检查可选字段缺失（这些将被自动填充）
  const missingOptional: string[] = [];
  if (result.quantity === null) missingOptional.push(FIELD_NAMES.quantity);
  if (result.unitPrice === null) missingOptional.push(FIELD_NAMES.unitPrice);
  
  return {
    invoiceType: result.invoiceType === '专票' ? '增值税专用发票' : '增值税普通发票',
    customerName: result.customerName || undefined,
    productType: result.productType || undefined,
    amount: result.amount || undefined,
    quantity: result.quantity || undefined,
    unitPrice: result.unitPrice || undefined,
    missingRequired,
    missingOptional,
    clarification: result.clarification || undefined,
    confidence: result.confidence,
    canProceed: missingRequired.length === 0  // 必填信息完整才能继续
  };
}

// 生成友好的解析结果描述（简洁版，无emoji）
export function generateParseResultMessage(result: ParsedInvoiceResult): string {
  const parts: string[] = [];
  
  parts.push(`发票类型：${result.invoiceType === '专票' ? '增值税专用发票' : '增值税普通发票'}`);
  
  if (result.customerName) {
    parts.push(`客户名称：${result.customerName}`);
  }
  
  if (result.productType) {
    parts.push(`商品/服务：${result.productType}`);
  }
  
  if (result.amount !== null) {
    parts.push(`金额：${result.amount.toLocaleString()}元`);
  }
  
  if (result.quantity !== null) {
    parts.push(`数量：${result.quantity}`);
  }
  
  if (result.unitPrice !== null) {
    parts.push(`单价：${result.unitPrice.toLocaleString()}元`);
  }
  
  return parts.join(' · ');
}

