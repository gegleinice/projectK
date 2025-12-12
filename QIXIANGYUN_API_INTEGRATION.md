# 企享云 API 集成说明

## 📦 已集成的模块

### 1. **核心服务层** (`lib/qixiangyunService.ts`)
- OAuth 认证与 Token 管理
- 企业信息查询
- 商品管理 (CRUD)
- 客户管理 (CRUD)
- 发票开具与查询
- 统一错误处理
- 自动重试机制
- Token 自动刷新与本地缓存

### 2. **业务集成**
- **企业信息**: `lib/qixiangyun.ts` - 支持真实API和模拟数据回退
- **商品目录**: `lib/productCatalog.ts` - 自动从税局同步商品信息
- **客户管理**: `lib/customerManagement.ts` - 客户信息维护
- **发票开具**: `lib/invoiceService.ts` - 数电票开具、查询、下载

### 3. **类型定义** (`lib/types/qixiangyun.ts`)
- 完整的TypeScript类型定义
- API 请求/响应接口
- 错误处理类

---

## 🚀 快速开始

### 步骤 1: 配置环境变量

创建 `.env.local` 文件:

```env
# 企享云 API 配置
NEXT_PUBLIC_QIXIANGYUN_APP_KEY=your_app_key_here
NEXT_PUBLIC_QIXIANGYUN_APP_SECRET=your_app_secret_here
QIXIANGYUN_API_BASE_URL=https://api.qixiangyun.com
```

> **获取AppKey和AppSecret**: 登录 [企享云开放平台](https://openapi.qixiangyun.com)

### 步骤 2: 安装依赖

```bash
npm install
# 或
yarn install
```

### 步骤 3: 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

---

## 💡 使用示例

### 1. 查询企业信息

```typescript
import { getCompanyInfo } from '@/lib/qixiangyun';

// 查询企业
const result = await getCompanyInfo('深圳市智慧科技有限公司');
if (result.success) {
  console.log('企业信息:', result.data);
}
```

### 2. 搜索商品

```typescript
import { searchProducts } from '@/lib/productCatalog';

// 搜索商品
const products = await searchProducts('软件服务', 5);
console.log('找到商品:', products);
```

### 3. 管理客户

```typescript
import { searchCustomers, addCustomer } from '@/lib/customerManagement';

// 搜索客户
const customers = await searchCustomers('腾讯');

// 添加客户
await addCustomer({
  name: '深圳市腾讯计算机系统有限公司',
  taxNumber: '914403001234567890',
  address: '深圳市南山区',
  phone: '0755-86013388'
});
```

### 4. 开具发票

```typescript
import { createInvoice } from '@/lib/invoiceService';

const invoice = {
  invoiceType: '普票',
  customerName: '腾讯',
  productType: '软件服务',
  amount: 50000,
  quantity: 1,
  taxRate: 6
};

const result = await createInvoice(invoice);
if (result.success) {
  console.log('发票号码:', result.invoiceNumber);
  console.log('PDF链接:', result.pdfUrl);
}
```

---

## 🔄 工作模式

系统支持两种工作模式:

### 模式 1: 真实 API (生产环境)
- **触发条件**: 配置了有效的 `NEXT_PUBLIC_QIXIANGYUN_APP_KEY` 和 `NEXT_PUBLIC_QIXIANGYUN_APP_SECRET`
- **特点**: 
  - 调用真实的企享云 API
  - 数据实时同步
  - 支持完整的税务功能

### 模式 2: 模拟数据 (开发/演示)
- **触发条件**: 未配置 API 密钥，或 API 调用失败时自动回退
- **特点**:
  - 使用本地模拟数据
  - 无需联网
  - 适合开发和演示

**智能回退机制**: 即使配置了真实API，如果调用失败，系统会自动回退到模拟数据，确保系统可用性。

---

## 🎯 核心特性

### 1. Token 管理
- ✅ 自动获取和刷新 Access Token
- ✅ Token 本地缓存 (localStorage)
- ✅ 过期前10分钟自动刷新
- ✅ 失败自动重试

### 2. 异步任务处理
- ✅ 支持轮询异步任务结果
- ✅ 可配置轮询间隔和超时
- ✅ 自动处理任务状态

### 3. 错误处理
- ✅ 统一的错误类型 (`QXYAPIError`)
- ✅ 详细的错误信息和错误码
- ✅ 请求ID追踪 (方便排查问题)

### 4. 数据缓存
- ✅ Token 缓存 (15天有效期)
- ✅ 企业信息缓存
- ✅ 减少不必要的 API 调用

---

## 🧪 测试

### 测试环境
系统在未配置真实API时,会自动使用模拟数据:

1. **企业绑定测试**
   - 访问 `/user/bindcompany`
   - 搜索演示企业(如"深圳市智慧科技有限公司")
   - 查看工商信息自动填充

2. **智能开票测试**
   - 访问 `/invoice`
   - 输入: "给腾讯开软件服务费5万"
   - 查看AI解析和发票生成

3. **商品搜索测试**
   - 在开票界面搜索商品
   - 系统会自动匹配税收分类编码

### 生产环境测试
配置真实API后:

1. 企业信息会从税局实时查询
2. 商品信息与税局同步
3. 发票会真实开具到税局系统

---

## 📝 API 接口映射

| 功能 | 本地方法 | 企享云API |
|------|---------|-----------|
| OAuth认证 | `getAccessToken()` | `/v2/public/oauth2/login` |
| 查询企业 | `queryCompanyInfo()` | `/v2/public/beginOrgInfoTask`<br>`/v2/public/queryOrgInfoTask` |
| 查询商品 | `queryProducts()` | `/v2/invoice/qdfp/spxxCx` |
| 新增商品 | `addProduct()` | `/v2/invoice/qdfp/spxxAdd` |
| 查询客户 | `queryCustomers()` | `/v2/invoice/qdfp/khxxCx` |
| 新增客户 | `addCustomer()` | `/v2/invoice/qdfp/khxxAdd` |
| 开具发票 | `createInvoice()` | `/v2/invoice/qdfp/fpkjZzs` |
| 查询发票 | `queryInvoices()` | `/v2/invoice/qdfp/fpcx` |
| 下载版式 | `downloadInvoicePDF()` | `/v2/invoice/qdfp/bswjxzBatch` |

---

## ⚠️ 注意事项

### 1. 安全性
- ❌ **不要**将 API 密钥提交到 Git 仓库
- ✅ 使用 `.env.local` 存储敏感信息
- ✅ 生产环境通过 Next.js API Routes 代理API调用

### 2. 速率限制
- 企享云API有调用频率限制
- 建议使用缓存减少API调用
- Token 至少7天更新一次

### 3. 数据一致性
- 企业信息、商品、客户数据与税局实时同步
- 开具的发票直接提交到税局系统
- **测试时注意**: 使用测试环境避免生成真实发票

### 4. 错误处理
- 所有API调用都有错误处理和回退机制
- 检查 `success` 字段判断操作是否成功
- 通过 `message` 获取详细错误信息

---

## 🔗 相关链接

- [企享云开放平台](https://openapi.qixiangyun.com)
- [API 文档](https://openapi.qixiangyun.com/doc-2179954)
- [MCP 配置](.cursor/mcp.json)

---

## 🆘 故障排查

### 问题 1: Token 获取失败
**原因**: AppKey 或 AppSecret 配置错误

**解决**: 
1. 检查 `.env.local` 中的配置
2. 确认 AppSecret 使用 MD5 小写加密
3. 查看控制台错误信息

### 问题 2: 企业信息查询失败
**原因**: 地区编码不正确或企业不存在

**解决**:
1. 确认企业名称和纳税识别号正确
2. 检查地区编码 (北京:11, 上海:31, 深圳:44)
3. 查看任务状态详情

### 问题 3: 发票开具失败
**原因**: 购方信息不完整、商品编码错误

**解决**:
1. 确保购方税号格式正确
2. 使用正确的税收分类编码
3. 检查发票金额和税率

### 问题 4: API 调用超时
**原因**: 网络问题或税局系统繁忙

**解决**:
1. 检查网络连接
2. 系统会自动转为异步处理
3. 通过异步结果查询接口获取结果

---

## 📧 技术支持

如需帮助，请联系:
- 企享云技术支持: [企享云工单系统](https://openapi.qixiangyun.com)
- 项目问题: 查看项目 Issues

---

*最后更新: 2024-12*

