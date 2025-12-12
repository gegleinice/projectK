// 企享云发票开具服务
import { QixiangyunBaseService } from './base';
import { getProductService } from './product';
import type {
  CreateInvoiceRequest,
  CreateInvoiceRequestData,
  CreateInvoiceResponse,
  AsyncResultRequest,
  AsyncResultResponse,
  InvoiceItem
} from './types';
import { ParsedInvoice } from '../invoiceParser';
import { CompanyInfo } from '../auth';

export interface InvoiceCreationResult {
  success: boolean;
  message: string;
  invoiceNumber?: string;
  invoiceCode?: string;
  pdfUrl?: string;
  ofdUrl?: string;
  xmlUrl?: string;
  createTime?: string;
  totalAmount?: number;
  isAsync?: boolean;
  requestId?: string;
  rawResponse?: CreateInvoiceResponse;
}

/**
 * 企享云发票开具服务
 */
export class QixiangyunInvoiceService extends QixiangyunBaseService {
  private productService = getProductService();

  /**
   * 创建发票
   * @param parsedInvoice 解析后的发票信息
   * @param sellerInfo 销售方企业信息
   */
  async createInvoice(
    parsedInvoice: ParsedInvoice,
    sellerInfo: CompanyInfo
  ): Promise<InvoiceCreationResult> {
    console.log('🎫 开始创建发票...');

    try {
      // 1. 映射发票请求数据
      const requestData = await this.mapInvoiceRequest(parsedInvoice, sellerInfo);

      // 2. 调用开票API（异步模式）
      const request: CreateInvoiceRequest = {
        action: 'fpkj_zzs',
        nsrsbh: sellerInfo.creditCode,
        aggOrgId: this.getAggOrgId(),
        data: requestData,
        async: true // 始终使用异步模式，避免超时
      };

      const response = await this.request<CreateInvoiceResponse>(
        '/v2/invoice/qdfp/fpkjZzs',
        request
      );

      // 3. 处理响应
      if (response.code === '2000' && response.data) {
        // 同步成功
        return this.formatSuccessResult(response.data, false);
      } else if (response.code === '2001') {
        // 转为异步处理
        const requestId = (response.data as any)?.requestId;
        if (!requestId) {
          throw new Error('异步任务ID缺失');
        }

        console.log(`⏳ 转为异步处理，任务ID: ${requestId}`);

        // 开始轮询异步结果
        const asyncResult = await this.pollAsyncResult(
          requestId,
          sellerInfo.creditCode,
          requestData.ly_ddbh
        );

        return this.formatSuccessResult(asyncResult, true, requestId);
      } else {
        throw new Error(response.message || '开票失败');
      }
    } catch (error) {
      console.error('❌ 开票失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '开票失败，请稍后重试'
      };
    }
  }

  /**
   * 轮询异步开票结果
   */
  private async pollAsyncResult(
    requestId: string,
    nsrsbh: string,
    ly_ddbh: string
  ): Promise<CreateInvoiceResponse> {
    return await this.poll<CreateInvoiceResponse>(
      async () => {
        const body: AsyncResultRequest = {
          action: 'asynresult',
          nsrsbh,
          aggOrgId: this.getAggOrgId(),
          data: {
            requestId,
            ly_ddbh
          }
        };

        const response = await this.request<AsyncResultResponse>(
          '/v2/invoice/qdfp/asynResult',
          body
        );

        if (!response.data) {
          return { completed: false };
        }

        const { execStatus, returnCode, returnMsg, returnBody } = response.data;

        if (execStatus === 2) {
          // 已完成
          if (returnCode === '0' && returnBody) {
            return { completed: true, result: returnBody };
          } else {
            return { completed: true, error: returnMsg || '开票失败' };
          }
        } else if (execStatus === 3) {
          // 执行失败
          return { completed: true, error: returnMsg || '异步任务失败' };
        } else {
          // 0:执行中, 1:待执行
          return { completed: false };
        }
      },
      {
        maxAttempts: 20,
        interval: 3000,
        timeoutMessage: '发票开具超时，请稍后在发票管理中查看'
      }
    );
  }

  /**
   * 映射发票请求数据
   */
  private async mapInvoiceRequest(
    parsed: ParsedInvoice,
    seller: CompanyInfo
  ): Promise<CreateInvoiceRequestData> {
    // 生成唯一订单编号
    const ly_ddbh = `ORDER_${Date.now()}_${this.randomString(8)}`;

    // 获取税收编码和简称
    const spbm = parsed.productName 
      ? await this.productService.getTaxCode(parsed.productName)
      : '3040000000000000000';
      
    const spmc = parsed.productName
      ? await this.productService.getTaxShortName(parsed.productName)
      : '服务';

    // 构建开票明细
    const xmmx: InvoiceItem[] = [{
      fphxz: '0', // 正常行
      spbm,
      spmc,
      xmmc: parsed.productName || parsed.productType,
      ggxh: parsed.category,
      dw: parsed.unit || '批',
      spsl: parsed.quantity?.toString() || '1',
      dj: parsed.unitPrice?.toFixed(2) || parsed.amount?.toFixed(2) || '0.00',
      sl: ((parsed.taxRate || 6) / 100).toFixed(2),
      je: parsed.amount?.toFixed(2) || '0.00',
      se: parsed.taxAmount?.toFixed(2)
    }];

    return {
      ly_ddbh,
      fplxdm: parsed.invoiceType === '专票' ? '032' : '030',

      // 销售方信息
      xsf_nsrsbh: seller.creditCode,
      xsf_nsrmc: seller.name,
      xsf_dz: seller.invoiceAddress || seller.registeredAddress,
      xsf_dh: seller.invoicePhone,
      xsf_yhmc: seller.bankName,
      xsf_yhzh: seller.bankAccount,

      // 购买方信息
      gmf_lx: parsed.customerInfo?.taxNumber ? '0' : '1',
      gmf_nsrsbh: parsed.customerInfo?.taxNumber,
      gmf_nsrmc: parsed.customerName,
      gmf_dz: parsed.customerInfo?.address,
      gmf_dh: parsed.customerInfo?.phone,
      gmf_yhmc: parsed.customerInfo?.bank,
      gmf_yhzh: parsed.customerInfo?.accountNumber,

      // 金额信息
      hjje: parsed.amount?.toFixed(2),
      hjse: parsed.taxAmount?.toFixed(2),
      jshj: parsed.totalAmount?.toFixed(2),
      hsslbs: '1', // 1=不含税价

      // 其他信息
      bz: parsed.remark || `AI智能开票，订单号: ${ly_ddbh}`,
      fhr: seller.legalPerson,
      skr: seller.legalPerson,

      // 开票明细
      xmmx,

      // 确认选项（忽略校验错误）
      gfxx_confirm: '0',
      kjje_confirm: '0',

      // 文件格式
      wjgs: 'OFD,PDF,XML'
    };
  }

  /**
   * 格式化成功结果
   */
  private formatSuccessResult(
    data: CreateInvoiceResponse,
    isAsync: boolean,
    requestId?: string
  ): InvoiceCreationResult {
    console.log(`✅ 发票开具成功 (${isAsync ? '异步' : '同步'}): ${data.fphm}`);

    return {
      success: true,
      message: '发票已成功开具',
      invoiceNumber: data.fphm,
      invoiceCode: data.fpdm,
      pdfUrl: data.pdf_url,
      ofdUrl: data.ofd_url,
      xmlUrl: data.xml_url,
      createTime: data.kprq,
      totalAmount: data.jshj,
      isAsync,
      requestId,
      rawResponse: data
    };
  }

  /**
   * 生成随机字符串
   */
  private randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// 导出单例
let invoiceService: QixiangyunInvoiceService | null = null;

export function getInvoiceService(): QixiangyunInvoiceService {
  if (!invoiceService) {
    invoiceService = new QixiangyunInvoiceService();
  }
  return invoiceService;
}

