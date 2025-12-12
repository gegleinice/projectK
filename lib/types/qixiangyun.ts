// 企享云 API 类型定义

/** API 通用响应结构 */
export interface QXYResponse<T = any> {
  code: string;
  message: string | null;
  success: boolean;
  reqId: string;
  data?: T;
}

/** OAuth Token 响应 */
export interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
}

/** 任务状态 */
export type TaskStatus = -1 | 0 | 1 | 3; // -1:创建失败, 0:无任务, 1:进行中, 3:完成

/** 任务响应 */
export interface TaskResponse {
  taskId: string;
}

/** 任务状态响应 */
export interface TaskStatusResponse {
  status: TaskStatus;
  statusMsg?: string | null;
  statusDetails?: {
    main: number;
    mainStatusCode: string;
    [key: string]: any;
  };
  [key: string]: any; // 动态结果数据
}

/** 企业基本信息 */
export interface CompanyBasicInfo {
  nsrsbh: string;         // 纳税人识别号
  nsrmc: string;          // 纳税人名称
  nslxmc: string;         // 纳税人类型名称
  fddbr?: string;         // 法定代表人
  zczb?: string;          // 注册资本
  clrq?: string;          // 成立日期
  zcdz?: string;          // 注册地址
  hyml?: string;          // 行业门类
  [key: string]: any;
}

/** 商品信息 */
export interface ProductInfo {
  id?: string;
  spbm?: string;          // 商品编码
  spmc: string;           // 商品名称
  spgg?: string;          // 商品规格
  jldw?: string;          // 计量单位
  dj?: number;            // 单价
  sl?: number;            // 税率
  ggxh?: string;          // 规格型号
  fplxdm?: string;        // 发票类型代码
  flbm?: string;          // 分类编码
  sslbm?: string;         // 税收分类编码
  yhzcbs?: string;        // 优惠政策标识
  [key: string]: any;
}

/** 客户信息 */
export interface CustomerInfo {
  id?: string;
  gfmc: string;           // 购方名称
  gfnsrsbh?: string;      // 购方纳税人识别号
  gfdz?: string;          // 购方地址
  gfdh?: string;          // 购方电话
  gfkhh?: string;         // 购方开户行
  gfzh?: string;          // 购方账号
  khfl?: string;          // 客户分类
  [key: string]: any;
}

/** 发票开具请求 */
export interface InvoiceCreateRequest {
  nsrsbh: string;         // 纳税人识别号
  areaCode: string;       // 地区编码
  fplxdm: string;         // 发票类型代码 (如: '026' 数电普票)
  gfmc: string;           // 购方名称
  gfnsrsbh?: string;      // 购方识别号
  gfdz?: string;          // 购方地址
  gfdh?: string;          // 购方电话
  gfkhh?: string;         // 购方开户行
  gfzh?: string;          // 购方账号
  spxx: Array<{           // 商品信息列表
    spmc: string;         // 商品名称
    ggxh?: string;        // 规格型号
    jldw?: string;        // 计量单位
    spsl: number;         // 商品数量
    spdj: number;         // 商品单价
    spje: number;         // 商品金额
    sl: number;           // 税率
    se: number;           // 税额
    sslbm?: string;       // 税收分类编码
  }>;
  bz?: string;            // 备注
  skr?: string;           // 收款人
  fhr?: string;           // 复核人
  kpr?: string;           // 开票人
  [key: string]: any;
}

/** 发票查询结果 */
export interface InvoiceInfo {
  fpdm?: string;          // 发票代码
  fphm: string;           // 发票号码
  kprq: string;           // 开票日期
  gfmc: string;           // 购方名称
  je: number;             // 金额
  se: number;             // 税额
  jshj: number;           // 价税合计
  fpzt?: string;          // 发票状态
  [key: string]: any;
}

/** API 错误 */
export class QXYAPIError extends Error {
  constructor(
    public code: string,
    message: string,
    public reqId?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'QXYAPIError';
  }
}

/** 轮询配置 */
export interface PollingConfig {
  maxAttempts?: number;   // 最大尝试次数
  interval?: number;      // 间隔时间(毫秒)
  timeout?: number;       // 超时时间(毫秒)
}

