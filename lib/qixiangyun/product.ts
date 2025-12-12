// 企享云商品管理和税码匹配服务
import { QixiangyunBaseService } from './base';
import type {
  QueryProductRequest,
  QueryProductResponse,
  ProductInfo,
  MatchTaxCodeRequest,
  MatchTaxCodeResponse,
  TaxCodeSuggestion
} from './types';

/**
 * 企享云商品管理服务
 */
export class QixiangyunProductService extends QixiangyunBaseService {
  /**
   * 查询商品列表
   * @param nsrsbh 纳税人识别号
   * @param options 查询选项
   */
  async queryProducts(
    nsrsbh: string,
    options: {
      pageIndex?: number;
      pageSize?: number;
      xmmc?: string; // 项目名称
      spfwbm?: string; // 税收服务编码
    } = {}
  ): Promise<{ records: number; list: ProductInfo[] }> {
    const {
      pageIndex = 0,
      pageSize = 20,
      xmmc,
      spfwbm
    } = options;

    const body: QueryProductRequest = {
      action: 'spxx_cx',
      nsrsbh,
      aggOrgId: this.getAggOrgId(),
      data: {
        pageIndex,
        pageSize,
        params: {
          xmmc,
          spfwbm
        }
      }
    };

    const response = await this.request<QueryProductResponse>(
      '/v2/invoice/qdfp/spxxCx',
      body
    );

    if (!response.data) {
      return { records: 0, list: [] };
    }

    console.log(`✅ 查询到 ${response.data.records} 个商品`);
    return response.data;
  }

  /**
   * 智能税收编码匹配
   * @param productName 商品名称
   * @param nsrsbh 纳税人识别号（可选，使用默认值）
   */
  async matchTaxCode(
    productName: string,
    nsrsbh?: string
  ): Promise<TaxCodeSuggestion[]> {
    const actualNsrsbh = nsrsbh || this.getDefaultNsrsbh();
    
    if (!actualNsrsbh) {
      console.warn('⚠️ 税号未配置，无法查询税收编码');
      return [];
    }

    console.log(`🔍 智能匹配税收编码: ${productName}`);

    const body: MatchTaxCodeRequest = {
      action: 'spxx_znfm',
      nsrsbh: actualNsrsbh,
      aggOrgId: this.getAggOrgId(),
      data: {
        xmmc: productName
      }
    };

    const response = await this.request<MatchTaxCodeResponse>(
      '/v2/invoice/qdfp/spxxZnFm',
      body
    );

    if (!response.data?.list) {
      console.log('📋 未找到匹配的税收编码');
      return [];
    }

    console.log(`✅ 找到 ${response.data.list.length} 个税收编码建议`);
    return response.data.list;
  }

  /**
   * 获取推荐税率
   * @param productName 商品名称
   */
  async getRecommendedTaxRate(productName: string): Promise<number> {
    try {
      const suggestions = await this.matchTaxCode(productName);
      
      if (suggestions.length > 0) {
        const firstSuggestion = suggestions[0];
        // 优先使用税率，如果没有税率则使用征收率
        const rateStr = firstSuggestion.slvList?.[0] || firstSuggestion.zslList?.[0] || '0.06';
        const rate = parseFloat(rateStr) * 100;
        console.log(`💡 推荐税率: ${rate}%`);
        return rate;
      }
    } catch (error) {
      console.error('获取推荐税率失败:', error);
    }

    // 默认返回6%（现代服务业常用税率）
    return 6;
  }

  /**
   * 获取商品的税收编码
   * @param productName 商品名称
   */
  async getTaxCode(productName: string): Promise<string> {
    try {
      const suggestions = await this.matchTaxCode(productName);
      
      if (suggestions.length > 0) {
        const taxCode = suggestions[0].sphfwssflhbbm;
        console.log(`📋 税收编码: ${taxCode}`);
        return taxCode;
      }
    } catch (error) {
      console.error('获取税收编码失败:', error);
    }

    // 默认返回通用服务编码
    return '3040000000000000000';
  }

  /**
   * 获取税收简称
   * @param productName 商品名称
   */
  async getTaxShortName(productName: string): Promise<string> {
    try {
      const suggestions = await this.matchTaxCode(productName);
      
      if (suggestions.length > 0) {
        const shortName = suggestions[0].spfwjc;
        console.log(`🏷️ 税收简称: ${shortName}`);
        return shortName;
      }
    } catch (error) {
      console.error('获取税收简称失败:', error);
    }

    // 默认返回商品名称本身
    return productName;
  }
}

// 导出单例
let productService: QixiangyunProductService | null = null;

export function getProductService(): QixiangyunProductService {
  if (!productService) {
    productService = new QixiangyunProductService();
  }
  return productService;
}

