// 发票开具集成模块
import { getQixiangyunService } from './qixiangyunService';
import { getCustomerByName } from './customerManagement';
import type { ParsedInvoice } from './invoiceParser';
import type { CompanyInfo } from './auth';

/** 发票开具结果 */
export interface InvoiceResult {
  success: boolean;
  invoiceNumber: string;
  pdfUrl?: string;
  ofdUrl?: string;
  xmlUrl?: string;
  createTime: string;
  message?: string;
}

// 是否使用真实API
const useRealAPI = typeof process !== 'undefined' && 
  process.env.NEXT_PUBLIC_QIXIANGYUN_APP_KEY && 
  process.env.NEXT_PUBLIC_QIXIANGYUN_APP_SECRET;

/**
 * 获取当前用户企业信息
 */
function getCurrentCompanyInfo(): { 
  company: CompanyInfo;
  areaCode: string;
} | null {
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
      company: user.company,
      areaCode
    };
  } catch {
    return null;
  }
}

/**
 * 开具发票
 */
export async function createInvoice(invoice: ParsedInvoice): Promise<InvoiceResult> {
  // 尝试使用真实API
  if (useRealAPI) {
    try {
      const companyInfo = getCurrentCompanyInfo();
      if (!companyInfo) {
        throw new Error('未获取到企业信息');
      }
      
      const service = getQixiangyunService();
      
      // 获取购方详细信息
      let customerInfo = invoice.customerInfo;
      if (!customerInfo && invoice.customerName) {
        const customer = await getCustomerByName(invoice.customerName);
        if (customer) {
          customerInfo = {
            name: customer.name,
            taxNumber: customer.taxNumber || '',
            address: customer.address || '',
            phone: customer.phone || '',
            bank: customer.bankName || '',
            accountNumber: customer.bankAccount || ''
          };
        }
      }
      
      // 构造开票请求
      const invoiceRequest = {
        nsrsbh: companyInfo.company.creditCode,
        areaCode: companyInfo.areaCode,
        fplxdm: invoice.invoiceType === '专票' ? '032' : '030', // 数电专票/普票
        ly_ddbh: `ORDER_${Date.now()}`, // 订单编号
        
        // 销方信息
        xsf_nsrsbh: companyInfo.company.creditCode,
        xsf_nsrmc: companyInfo.company.name,
        xsf_dz: companyInfo.company.invoiceAddress || companyInfo.company.registeredAddress,
        xsf_dh: companyInfo.company.invoicePhone,
        xsf_yhmc: companyInfo.company.bankName,
        xsf_yhzh: companyInfo.company.bankAccount,
        
        // 购方信息
        gmf_lx: customerInfo?.taxNumber ? '0' : '1', // 0-企业 1-个人
        gmf_nsrmc: customerInfo?.name || invoice.customerName,
        gmf_nsrsbh: customerInfo?.taxNumber || '',
        gmf_dz: customerInfo?.address || '',
        gmf_dh: customerInfo?.phone || '',
        gmf_yhmc: customerInfo?.bank || '',
        gmf_yhzh: customerInfo?.accountNumber || '',
        
        // 金额信息
        hjje: invoice.amount?.toString(),
        hjse: invoice.taxAmount?.toString(),
        jshj: invoice.totalAmount?.toString() || invoice.amount?.toString(),
        
        // 备注
        bz: invoice.remark,
        
        // 其他人员
        kpr: '系统',
        fhr: '系统',
        skr: '系统',
        
        // 商品明细
        spxx: [{
          mxxh: '1',
          fphxz: '0', // 正常行
          spmc: invoice.productName || invoice.productType,
          xmmc: invoice.productName || invoice.productType,
          spbm: '1090101000000000000', // 税收分类编码(简化处理，实际需匹配)
          ggxh: '',
          dw: invoice.unit || '项',
          spsl: invoice.quantity?.toString() || '1',
          dj: invoice.unitPrice?.toString() || invoice.amount?.toString(),
          sl: ((invoice.taxRate || 6) / 100).toString(),
          je: invoice.amount?.toString(),
          se: invoice.taxAmount?.toString()
        }],
        
        // 版式文件格式
        wjgs: 'OFD,PDF,XML',
        
        // 忽略购方信息错误
        gfxx_confirm: '0',
        
        // 忽略大金额提示
        kjje_confirm: '0'
      };
      
      // 调用开票API
      const result = await service.createInvoice(invoiceRequest);
      
      return {
        success: true,
        invoiceNumber: result.fphm,
        pdfUrl: result.pdf_url,
        ofdUrl: result.ofd_url,
        xmlUrl: result.xml_url,
        createTime: result.kprq || new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Real API create invoice failed:', error);
      return {
        success: false,
        invoiceNumber: '',
        createTime: new Date().toISOString(),
        message: error.message || '开票失败'
      };
    }
  }
  
  // 模拟开票
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const invoiceNumber = `FP${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
  
  return {
    success: true,
    invoiceNumber,
    pdfUrl: `/invoices/${invoiceNumber}.pdf`,
    ofdUrl: `/invoices/${invoiceNumber}.ofd`,
    createTime: new Date().toISOString()
  };
}

/**
 * 查询发票列表
 */
export async function queryInvoices(startDate: string, endDate: string): Promise<any[]> {
  if (useRealAPI) {
    try {
      const companyInfo = getCurrentCompanyInfo();
      if (!companyInfo) return [];
      
      const service = getQixiangyunService();
      const invoices = await service.queryInvoices(
        companyInfo.company.creditCode,
        companyInfo.areaCode,
        startDate,
        endDate
      );
      
      return invoices;
    } catch (error) {
      console.error('Real API query invoices failed:', error);
    }
  }
  
  // 返回空列表
  return [];
}

/**
 * 下载发票PDF
 */
export async function downloadInvoicePDF(invoiceNumber: string): Promise<string | null> {
  if (useRealAPI) {
    try {
      const companyInfo = getCurrentCompanyInfo();
      if (!companyInfo) return null;
      
      const service = getQixiangyunService();
      const urls = await service.downloadInvoicePDF(
        companyInfo.company.creditCode,
        companyInfo.areaCode,
        [invoiceNumber]
      );
      
      return urls[0] || null;
    } catch (error) {
      console.error('Real API download invoice failed:', error);
    }
  }
  
  // 模拟下载地址
  return `/invoices/${invoiceNumber}.pdf`;
}

