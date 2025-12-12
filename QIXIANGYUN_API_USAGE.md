# 企享云 API 对接使用文档

## 📚 目录

1. [快速开始](#快速开始)
2. [环境配置](#环境配置)
3. [核心功能](#核心功能)
4. [API使用示例](#api使用示例)
5. [错误处理](#错误处理)
6. [常见问题](#常见问题)
7. [注意事项](#注意事项)

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /Users/raysteve/AIAccounting
npm install crypto-js @types/crypto-js
```

### 2. 配置环境变量

在项目根目录创建或编辑 `.env.local` 文件：

```env
# 企享云API配置
NEXT_PUBLIC_QIXIANGYUN_BASE_URL=https://mcp.qixiangyun.com
QIXIANGYUN_APPKEY=10001995
QIXIANGYUN_APPSECRET=abPy4n7MPuPB8SXAIUrqixVDDv0SPVMYGx1ljIDKEAvXsuYm

# 企业配置（从企享云平台获取或查询）
QIXIANGYUN_AGG_ORG_ID=your_agg_org_id
QIXIANGYUN_DEFAULT_NSRSBH=your_company_tax_number
QIXIANGYUN_DEFAULT_AREA_CODE=44

# 开发模式（true=使用模拟数据回退, false=强制使用真实API）
QIXIANGYUN_ENABLE_FALLBACK=true
```

**重要提示**: 
- `QIXIANGYUN_AGG_ORG_ID` 需要从企享云管理后台获取，或咨询企享云技术支持
- `QIXIANGYUN_DEFAULT_NSRSBH` 填写您公司的税号（18位统一社会信用代码）
- AppSecret 已经是原始值，系统会自动进行 MD5 处理

### 3. 重启开发服务器

```bash
npm run dev
```

---

## ⚙️ 环境配置

### 必需配置

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `NEXT_PUBLIC_QIXIANGYUN_BASE_URL` | API基础URL | `https://mcp.qixiangyun.com` |
| `QIXIANGYUN_APPKEY` | 应用Key | `10001995` |
| `QIXIANGYUN_APPSECRET` | 应用Secret（原始值） | `abPy4n7MPuPB...` |

### 可选配置

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `QIXIANGYUN_AGG_ORG_ID` | 企业ID | 无 |
| `QIXIANGYUN_DEFAULT_NSRSBH` | 默认税号 | 无 |
| `QIXIANGYUN_DEFAULT_AREA_CODE` | 默认地区编码 | `44`（广东） |
| `QIXIANGYUN_ENABLE_FALLBACK` | 启用回退机制 | `true` |

### 地区编码参考

| 地区 | 2位编码 | 4位编码 |
|------|---------|---------|
| 北京 | `11` | `1101` |
| 上海 | `31` | `3101` |
| 浙江省 | `33` | - |
| 广东省 | `44` | - |
| 深圳市 | `44` | `4403` |
| 杭州市 | `33` | `3301` |

---

## 🎯 核心功能

### 1. 认证鉴权

**自动 Token 管理**:
- access_token 有效期: 15天
- 自动缓存到 localStorage
- 距离过期1小时自动刷新
- 支持 refresh_token 机制

**签名算法**:
```typescript
MD5(access_token + req_date + request_body + MD5(appsecret))
```

### 2. 企业信息查询

**异步任务模式**:
1. 调用 `beginOrgInfoTask` 发起查询
2. 获取 `taskId`
3. 轮询 `queryOrgInfoTask` 获取结果
4. 最多轮询30次，间隔2秒

**支持查询内容**:
- 企业基本信息（名称、税号、法人等）
- 纳税人类型（一般纳税人/小规模纳税人）
- 注册资本、成立日期
- 主管税务机关

### 3. 商品管理

**智能税收编码匹配**:
- 输入商品名称
- AI推荐匹配的税收编码
- 返回适用税率和征收率
- 支持多个编码建议

**商品列表查询**:
- 分页查询
- 按名称、编码搜索
- 按分类筛选

### 4. 客户管理

**客户信息查询**:
- 按客户名称搜索
- 按税号精确查询
- 获取默认地址、银行账号等

### 5. 发票开具

**异步开票流程**:
- 默认使用异步模式（避免超时）
- 同步处理超过40秒自动转异步
- 轮询异步结果（最多20次，间隔3秒）
- 支持 OFD、PDF、XML 多种格式

**发票类型**:
- `030`: 数电普票
- `032`: 数电专票

---

## 💻 API使用示例

### 企业信息查询

```typescript
import { getCompanyService } from '@/lib/qixiangyun';

// 获取服务实例
const companyService = getCompanyService();

// 查询企业信息
try {
  const companyInfo = await companyService.getCompanyInfo(
    '914403001234567890', // 税号
    '44'                   // 地区编码
  );
  
  console.log('企业名称:', companyInfo.nsrmc);
  console.log('纳税人类型:', companyInfo.nslxmc);
  console.log('法定代表人:', companyInfo.fddbr);
} catch (error) {
  console.error('查询失败:', error);
}
```

### 智能税收编码匹配

```typescript
import { getProductService } from '@/lib/qixiangyun';

const productService = getProductService();

// 匹配税收编码
const suggestions = await productService.matchTaxCode('技术服务');

suggestions.forEach(item => {
  console.log('税收编码:', item.sphfwssflhbbm);
  console.log('税收简称:', item.spfwjc);
  console.log('税收名称:', item.hwhlwmc);
  console.log('适用税率:', item.slvList);
  console.log('征收率:', item.zslList);
});

// 获取推荐税率
const taxRate = await productService.getRecommendedTaxRate('软件开发服务');
console.log('推荐税率:', taxRate, '%');
```

### 客户信息查询

```typescript
import { getCustomerService } from '@/lib/qixiangyun';

const customerService = getCustomerService();

// 搜索客户
const customers = await customerService.searchCustomers('腾讯');

customers.forEach(customer => {
  console.log('客户名称:', customer.name);
  console.log('客户税号:', customer.taxNumber);
  console.log('地址:', customer.address);
  console.log('电话:', customer.phone);
  console.log('银行:', customer.bank);
  console.log('账号:', customer.accountNumber);
});
```

### 发票开具

```typescript
import { getInvoiceService } from '@/lib/qixiangyun';
import { ParsedInvoice } from '@/lib/invoiceParser';
import { CompanyInfo } from '@/lib/auth';

const invoiceService = getInvoiceService();

// 准备发票数据
const parsedInvoice: ParsedInvoice = {
  invoiceType: '普票',
  customerName: '深圳市腾讯计算机系统有限公司',
  amount: 10000,
  quantity: 1,
  unitPrice: 10000,
  productType: '软件开发服务',
  productName: '软件技术服务',
  taxRate: 6,
  taxAmount: 600,
  totalAmount: 10600,
  unit: '批',
  customerInfo: {
    name: '深圳市腾讯计算机系统有限公司',
    taxNumber: '914403001234567890',
    address: '深圳市南山区科技园',
    phone: '0755-86013388',
    bank: '中国工商银行',
    accountNumber: '4000029109200072935'
  }
};

// 销售方信息（从当前登录用户获取）
const sellerInfo: CompanyInfo = {
  // ... 您公司的完整信息
};

// 开具发票
try {
  const result = await invoiceService.createInvoice(parsedInvoice, sellerInfo);
  
  if (result.success) {
    console.log('✅ 发票开具成功！');
    console.log('发票号码:', result.invoiceNumber);
    console.log('开票时间:', result.createTime);
    console.log('价税合计:', result.totalAmount);
    console.log('PDF下载:', result.pdfUrl);
    console.log('OFD下载:', result.ofdUrl);
    console.log('处理方式:', result.isAsync ? '异步' : '同步');
  } else {
    console.error('❌ 开票失败:', result.message);
  }
} catch (error) {
  console.error('开票异常:', error);
}
```

---

## ⚠️ 错误处理

### 错误类型

```typescript
import { QixiangyunError, getFriendlyErrorMessage } from '@/lib/qixiangyun';

try {
  // 调用API
  await someApiCall();
} catch (error) {
  if (error instanceof QixiangyunError) {
    console.log('错误码:', error.code);
    console.log('错误信息:', error.message);
    console.log('请求ID:', error.reqId);
  }
  
  // 获取友好的错误提示
  const friendlyMsg = getFriendlyErrorMessage(error);
  alert(friendlyMsg);
}
```

### 常见错误码

| 错误码 | 含义 | 解决方案 |
|--------|------|----------|
| `4001` | 认证失败 | 检查 AppKey 和 AppSecret |
| `4002` | Token 过期 | 系统会自动刷新 |
| `5001` | 税号错误 | 检查税号格式（18位） |
| `5006` | 购方税号校验失败 | 确认购方税号有效性 |
| `700009` | 转为异步处理 | 正常情况，系统会自动轮询 |

### 回退机制

所有API调用都内置了回退机制：

```typescript
// 自动回退示例
try {
  // 尝试真实API
  return await qixiangyunApi.getCompanyInfo(taxNumber);
} catch (error) {
  console.warn('API调用失败，使用模拟数据');
  // 自动回退到模拟数据
  return mockCompanyDatabase[companyName];
}
```

---

## ❓ 常见问题

### 1. 如何获取 aggOrgId？

**方法一**: 登录企享云管理后台查看  
**方法二**: 联系企享云技术支持获取  
**方法三**: 暂时留空，部分功能（如商品管理）可能受限

### 2. 开票时提示"购方税号校验失败"

- 确保购方税号为18位统一社会信用代码
- 专票必须填写购方税号
- 普票给个人开具时，设置 `gmf_lx='1'`，税号可以为空

### 3. 异步开票一直超时

- 检查网络连接
- 查看 aggOrgId 是否正确配置
- 税局系统可能繁忙，建议稍后重试

### 4. Token 频繁过期

- Token 默认有效期15天
- 系统会自动刷新，无需手动处理
- 如频繁失效，检查系统时间是否正确

### 5. 如何测试开票功能？

**⚠️ 重要警告**: 配置真实API后，所有开票操作都会生成真实发票！

**建议**:
1. 先在测试环境验证
2. 使用小金额测试
3. 开票前仔细核对信息
4. 咨询企享云获取测试环境凭证

---

## 📋 注意事项

### 生产环境使用

1. **⚠️ 严重警告**: 真实API会生成正式发票并上报税局！
2. **数据验证**: 开票前务必验证所有信息准确性
3. **金额精度**: 所有金额保留2位小数
4. **税率选择**: 根据商品类型自动匹配，支持手动调整
5. **API限流**: login接口建议7天调用一次

### 安全建议

1. **密钥保护**: 
   - ❌ 不要将 `.env.local` 提交到 Git
   - ❌ 不要在前端暴露 AppSecret
   - ✅ 生产环境建议使用服务端代理

2. **权限控制**:
   - 限制开票操作的用户权限
   - 记录所有开票操作日志
   - 定期审计发票数据

### 性能优化

1. **Token 缓存**: 内存 + localStorage 双层缓存
2. **商品缓存**: 常用商品信息本地缓存30分钟
3. **客户缓存**: 最近查询的客户信息缓存
4. **批量查询**: 支持批量查询商品和客户

---

## 📞 技术支持

- **企享云官网**: https://www.qixiangyun.com
- **API文档**: https://openapi.qixiangyun.com
- **技术支持**: 通过企享云官网联系

---

## 📝 更新日志

### v1.0.0 (2024-12-13)

- ✅ 完成认证鉴权模块
- ✅ 集成企业信息查询
- ✅ 集成商品管理和智能税码匹配
- ✅ 集成客户管理
- ✅ 实现发票开具（支持同步/异步）
- ✅ 完善错误处理和回退机制
- ✅ 编写完整使用文档

---

**祝您使用愉快！** 🎉

如有问题，请查看控制台日志或联系技术支持。

