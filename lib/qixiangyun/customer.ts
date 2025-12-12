// 企享云客户管理服务
import { QixiangyunBaseService } from './base';
import type {
  QueryCustomerRequest,
  QueryCustomerResponse,
  CustomerInfo as QXCustomerInfo
} from './types';
import { CustomerInfo } from '../mockData';

/**
 * 企享云客户管理服务
 */
export class QixiangyunCustomerService extends QixiangyunBaseService {
  /**
   * 查询客户列表
   * @param nsrsbh 纳税人识别号
   * @param options 查询选项
   */
  async queryCustomers(
    nsrsbh: string,
    options: {
      pageIndex?: number;
      pageSize?: number;
      gmfmc?: string; // 客户名称
      gmfnsrsbh?: string; // 客户税号
    } = {}
  ): Promise<{ records: number; list: QXCustomerInfo[] }> {
    const {
      pageIndex = 0,
      pageSize = 20,
      gmfmc,
      gmfnsrsbh
    } = options;

    const body: QueryCustomerRequest = {
      action: 'khxx_cx',
      nsrsbh,
      aggOrgId: this.getAggOrgId(),
      data: {
        pageIndex,
        pageSize,
        params: {
          gmfmc,
          gmfnsrsbh
        }
      }
    };

    const response = await this.request<QueryCustomerResponse>(
      '/v2/invoice/qdfp/khxxCx',
      body
    );

    if (!response.data) {
      return { records: 0, list: [] };
    }

    console.log(`✅ 查询到 ${response.data.records} 个客户`);
    return response.data;
  }

  /**
   * 搜索客户
   * @param keyword 搜索关键词（名称或税号）
   * @param nsrsbh 销售方税号
   */
  async searchCustomers(keyword: string, nsrsbh?: string): Promise<CustomerInfo[]> {
    const actualNsrsbh = nsrsbh || this.getDefaultNsrsbh();
    
    if (!actualNsrsbh) {
      console.warn('⚠️ 税号未配置，无法查询客户');
      return [];
    }

    console.log(`🔍 搜索客户: ${keyword}`);

    try {
      // 尝试按名称搜索
      const result = await this.queryCustomers(actualNsrsbh, {
        gmfmc: keyword,
        pageSize: 10
      });

      return result.list.map(qxCustomer => this.mapToCustomerInfo(qxCustomer));
    } catch (error) {
      console.error('搜索客户失败:', error);
      return [];
    }
  }

  /**
   * 根据客户名称获取客户信息
   * @param name 客户名称
   * @param nsrsbh 销售方税号
   */
  async getCustomerByName(name: string, nsrsbh?: string): Promise<CustomerInfo | undefined> {
    const customers = await this.searchCustomers(name, nsrsbh);
    
    // 精确匹配
    const exactMatch = customers.find(c => c.name === name);
    if (exactMatch) return exactMatch;

    // 模糊匹配
    return customers.find(c => c.name.includes(name) || name.includes(c.name));
  }

  /**
   * 将企享云客户信息转换为系统CustomerInfo格式
   */
  mapToCustomerInfo(qxCustomer: QXCustomerInfo): CustomerInfo {
    // 获取默认地址信息
    const defaultAddress = qxCustomer.dzxxList?.find(dz => dz.sfmrdz === 'Y') || qxCustomer.dzxxList?.[0];

    return {
      name: qxCustomer.gmfmc,
      taxNumber: qxCustomer.gmfnsrsbh,
      address: defaultAddress?.dz || '',
      phone: defaultAddress?.lxdh || '',
      bank: defaultAddress?.yhyywdmc || '',
      accountNumber: defaultAddress?.yhzh || '',
      isUserDefined: false
    };
  }
}

// 导出单例
let customerService: QixiangyunCustomerService | null = null;

export function getCustomerService(): QixiangyunCustomerService {
  if (!customerService) {
    customerService = new QixiangyunCustomerService();
  }
  return customerService;
}

