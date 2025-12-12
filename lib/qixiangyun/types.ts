// 企享云API类型定义

// 通用响应结构
export interface QixiangyunResponse<T = any> {
  code: string;
  success: boolean;
  message: string | null;
  reqId: string;
  data: T | null;
}

// 自然人获取企业列表相关
export interface NaturalPersonCompany {
  xh: number; // 序号
  nsrsbh: string; // 纳税人识别号
  nsrmc: string; // 纳税人名称
  sflx: string; // 身份类型
  glzt: string; // 关联状态 (00: 已启用)
}

export interface QueryOrglistRequest {
  gryhm: string; // 个人用户名(办税人手机号)
  gryhmm: string; // 密码(需要RSA加密)
}

export interface QueryOrglistResponse {
  msg: string;
  result: NaturalPersonCompany[];
  code: string;
}

// 企业信息相关
export interface CompanyBasicInfo {
  nsrsbh: string; // 纳税人识别号
  nsrmc: string; // 纳税人名称
  nslxmc: string; // 纳税人类型名称
  fddbr?: string; // 法定代表人
  zczb?: string; // 注册资本
  clrq?: string; // 成立日期
  djzclx?: string; // 登记注册类型
  zgswjgmc?: string; // 主管税务机关名称
  scjydz?: string; // 生产经营地址
  lxdh?: string; // 联系电话
}

export interface BeginOrgInfoTaskRequest {
  nsrsbh: string;
  areaCode: string;
}

export interface BeginOrgInfoTaskResponse {
  taskId: string;
}

export interface QueryOrgInfoTaskRequest {
  taskId: string;
  nsrsbh: string;
}

export interface QueryOrgInfoTaskResponse {
  status: number; // -1:失败, 0:无任务, 1:进行中, 3:完成
  statusMsg: string | null;
  jcxx?: {
    status: string;
    taxCompanyEnterpriseInfoDtoPageResult: CompanyBasicInfo;
  };
}

// 商品管理相关
export interface ProductInfo {
  uuid: string;
  fluuid: string; // 商品分类UUID
  xmmc: string; // 项目名称
  ggxh?: string; // 规格型号
  dwdm?: string; // 单位代码
  dwmc?: string; // 单位名称
  spfwbm: string; // 税收服务编码
  spfwjc: string; // 税收服务简称
  jm?: string; // 简码
  dj?: string; // 单价
  hsbz?: string; // 含税标记 Y/N
  slv: string; // 税率
  yhzsbz?: string; // 优惠政策标志
  zzstsgl?: string; // 增值税特殊管理
}

export interface QueryProductRequest {
  action: 'spxx_cx';
  nsrsbh: string;
  aggOrgId: string;
  accountId?: string;
  async?: boolean;
  data: {
    pageIndex: number;
    pageSize: number;
    params: {
      xmmc?: string; // 项目名称
      spfwbm?: string; // 税收服务编码
      fluuid?: string; // 分类UUID
    };
  };
}

export interface QueryProductResponse {
  records: number;
  list: ProductInfo[];
}

// 税收编码匹配
export interface TaxCodeSuggestion {
  sphfwssflhbbm: string; // 税收编码
  spfwjc: string; // 税收简称
  hwhlwmc: string; // 税收名称
  slvList: string[]; // 适用税率列表
  zslList: string[]; // 适用征收率列表
  tdyslxDm?: string; // 特定要素类型代码
  zzscezsbj?: string; // 增值税差额征收标记
}

export interface MatchTaxCodeRequest {
  action: 'spxx_znfm';
  nsrsbh: string;
  aggOrgId: string;
  data: {
    xmmc: string; // 商品名称
  };
}

export interface MatchTaxCodeResponse {
  list: TaxCodeSuggestion[];
}

// 客户管理相关
export interface CustomerInfo {
  khxxuuid: string; // 客户UUID
  khfluuid?: string; // 客户分类UUID
  gmfnsrsbh: string; // 客户税号
  gmfmc: string; // 客户名称
  jm?: string; // 简码
  dzxxList?: Array<{
    dzxxuuid: string;
    dz?: string; // 地址
    lxdh?: string; // 电话
    yhyywdmc?: string; // 银行名称
    yhzh?: string; // 银行账号
    sfmrdz: string; // 是否默认地址 Y/N
    email?: string;
  }>;
}

export interface QueryCustomerRequest {
  action: 'khxx_cx';
  nsrsbh: string;
  aggOrgId: string;
  data: {
    pageIndex: number;
    pageSize: number;
    params: {
      gmfmc?: string; // 客户名称
      gmfnsrsbh?: string; // 客户税号
    };
  };
}

export interface QueryCustomerResponse {
  records: number;
  list: CustomerInfo[];
}

// 发票开具相关
export interface InvoiceItem {
  mxxh?: string; // 明细序号
  fphxz: string; // 发票行性质 0:正常行 1:折扣行 2:被折扣行
  spbm: string; // 税收商品编码
  spmc: string; // 税收商品名称
  xmmc: string; // 项目名称
  ggxh?: string; // 规格型号
  dw?: string; // 单位
  spsl?: string; // 商品数量
  dj?: string; // 单价
  sl: string; // 税率
  je: string; // 金额
  se?: string; // 税额
  tdzsfsdm?: string; // 特定征税方式代码
  ssyhzclx?: string; // 税收优惠政策类型
}

export interface CreateInvoiceRequestData {
  ly_ddbh: string; // 来源订单编号
  fplxdm: string; // 发票类型代码 030:普票 032:专票
  
  // 销售方信息
  xsf_nsrsbh: string;
  xsf_nsrmc: string;
  xsf_dz: string;
  xsf_dh: string;
  xsf_yhmc: string;
  xsf_yhzh: string;
  
  // 购买方信息
  gmf_lx: string; // 0:企业 1:个人
  gmf_nsrsbh?: string;
  gmf_nsrmc: string;
  gmf_dz?: string;
  gmf_dh?: string;
  gmf_yhmc?: string;
  gmf_yhzh?: string;
  
  // 金额信息
  hjje?: string; // 合计金额
  hjse?: string; // 合计税额
  jshj?: string; // 价税合计
  hsslbs?: string; // 含税标识 1:不含税 2:含税
  
  // 其他信息
  bz?: string; // 备注
  fhr: string; // 复核人
  skr: string; // 收款人
  
  // 开票明细
  xmmx: InvoiceItem[];
  
  // 确认选项
  gfxx_confirm?: string; // 购方信息确认
  kjje_confirm?: string; // 大金额确认
  
  // 文件格式
  wjgs?: string; // OFD,PDF,XML,EWM
}

export interface CreateInvoiceRequest {
  action: 'fpkj_zzs';
  nsrsbh: string;
  aggOrgId: string;
  accountId?: string;
  async?: boolean;
  data: CreateInvoiceRequestData;
}

export interface CreateInvoiceResponse {
  kplsh: string; // 开票流水号
  fplxdm: string; // 发票类型代码
  fpdm?: string; // 发票代码
  zzfphm?: string; // 纸质发票号码
  fphm: string; // 发票号码
  kprq: string; // 开票日期
  kplx: string; // 开票类型 0:蓝票
  jshj: number; // 价税合计
  gmfNsrsbh?: string;
  gmfNsrmc: string;
  xsfNsrsbh: string;
  xsfNsrmc: string;
  pdf_url?: string;
  ofd_url?: string;
  xml_url?: string;
  ewm_url?: string;
}

// 异步任务相关
export interface AsyncResultRequest {
  action: 'asynresult';
  nsrsbh: string;
  aggOrgId: string;
  data: {
    requestId?: string;
    ly_ddbh?: string;
  };
}

export interface AsyncResultResponse {
  execStatus: number; // 0:执行中 1:待执行 2:已完成 3:失败
  returnCode: string; // "0"成功
  returnMsg: string;
  returnBody?: CreateInvoiceResponse;
  request: {
    requestId: string;
    requestTime: number;
    bizType: string;
    action: string;
    nsrsbh: string;
    ly_ddbh: string;
  };
}

