// 企享云企业信息查询服务
import { QixiangyunBaseService } from './base';
import type {
  BeginOrgInfoTaskRequest,
  BeginOrgInfoTaskResponse,
  QueryOrgInfoTaskRequest,
  QueryOrgInfoTaskResponse,
  CompanyBasicInfo
} from './types';
import { CompanyInfo } from '../auth';

/**
 * 企享云企业信息查询服务
 */
export class QixiangyunCompanyService extends QixiangyunBaseService {
  /**
   * 发起企业信息采集任务
   */
  async beginOrgInfoTask(nsrsbh: string, areaCode: string): Promise<string> {
    const body: BeginOrgInfoTaskRequest = {
      nsrsbh,
      areaCode
    };

    const response = await this.request<BeginOrgInfoTaskResponse>(
      '/v2/public/beginOrgInfoTask',
      body
    );

    if (!response.data?.taskId) {
      throw new Error('未获取到任务ID');
    }

    return response.data.taskId;
  }

  /**
   * 查询企业信息任务状态
   */
  async queryOrgInfoTask(
    taskId: string,
    nsrsbh: string
  ): Promise<QueryOrgInfoTaskResponse> {
    const body: QueryOrgInfoTaskRequest = {
      taskId,
      nsrsbh
    };

    const response = await this.request<QueryOrgInfoTaskResponse>(
      '/v2/public/queryOrgInfoTask',
      body
    );

    return response.data!;
  }

  /**
   * 查询企业基本信息（带轮询）
   * @param nsrsbh 纳税人识别号
   * @param areaCode 地区编码（2位或4位）
   */
  async getCompanyInfo(nsrsbh: string, areaCode?: string): Promise<CompanyBasicInfo> {
    const actualAreaCode = areaCode || this.getDefaultAreaCode();
    
    console.log(`🔍 查询企业信息: ${nsrsbh}, 地区编码: ${actualAreaCode}`);

    // 1. 发起任务
    const taskId = await this.beginOrgInfoTask(nsrsbh, actualAreaCode);
    console.log(`✅ 任务已创建: ${taskId}`);

    // 2. 轮询任务结果
    const result = await this.poll<CompanyBasicInfo>(
      async () => {
        const taskResult = await this.queryOrgInfoTask(taskId, nsrsbh);

        if (taskResult.status === 3) {
          // 完成
          const companyInfo = taskResult.jcxx?.taxCompanyEnterpriseInfoDtoPageResult;
          if (!companyInfo) {
            return { completed: true, error: '未获取到企业信息' };
          }
          return { completed: true, result: companyInfo };
        } else if (taskResult.status === -1) {
          // 失败
          return {
            completed: true,
            error: taskResult.statusMsg || '企业信息查询失败'
          };
        } else {
          // 进行中
          return { completed: false };
        }
      },
      {
        maxAttempts: 30,
        interval: 2000,
        timeoutMessage: '企业信息查询超时，请稍后重试'
      }
    );

    console.log(`✅ 企业信息查询成功: ${result.nsrmc}`);
    return result;
  }

  /**
   * 将企享云企业信息转换为系统CompanyInfo格式
   */
  mapToCompanyInfo(qxCompany: CompanyBasicInfo): CompanyInfo {
    // 判断纳税人类型
    const taxType = qxCompany.nslxmc?.includes('一般') ? '一般纳税人' : '小规模纳税人';

    return {
      name: qxCompany.nsrmc,
      creditCode: qxCompany.nsrsbh,
      legalPerson: qxCompany.fddbr || '',
      registeredCapital: qxCompany.zczb || '',
      establishDate: qxCompany.clrq || '',
      businessStatus: '存续', // 企享云API可能没有直接提供，使用默认值
      industry: '',
      creditLevel: 'A',
      companyType: qxCompany.djzclx || '有限责任公司',
      taxAuthority: qxCompany.zgswjgmc || '',
      registeredAddress: qxCompany.scjydz || '',
      province: '',
      city: '',
      district: '',
      businessScope: '',
      mainBusiness: [],
      industryCategory: '',
      invoiceAddress: qxCompany.scjydz || '',
      invoicePhone: qxCompany.lxdh || '',
      bankName: '',
      bankAccount: '',
      taxType,
      invoiceQuota: taxType === '一般纳税人' ? 10000000 : 5000000
    };
  }
}

// 导出单例
let companyService: QixiangyunCompanyService | null = null;

export function getCompanyService(): QixiangyunCompanyService {
  if (!companyService) {
    companyService = new QixiangyunCompanyService();
  }
  return companyService;
}

