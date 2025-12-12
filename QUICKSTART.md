# 企享云 API 对接 - 快速开始指南

## 🎯 5分钟快速上手

### 第1步: 环境变量配置（ 已完成）

您的 API 凭证已配置：
- ✅ AppKey: `10001995`
- ✅ AppSecret: `abPy4n7MPuPB8SXAIUrqixVDDv0SPVMYGx1ljIDKEAvXsuYm`

**还需要配置**:
```bash
# 编辑 .env.local 文件，添加以下内容：
QIXIANGYUN_AGG_ORG_ID=your_agg_org_id  # 从企享云管理后台获取
QIXIANGYUN_DEFAULT_NSRSBH=91440300...  # 您公司的18位税号
```

### 第2步: 启动项目

```bash
cd /Users/raysteve/AIAccounting
npm run dev
```

访问: http://localhost:3008

### 第3步: 测试功能

#### 1. 测试企业信息查询

打开浏览器控制台，输入：

```javascript
// 测试企业信息查询
const { getCompanyService } = await import('/lib/qixiangyun/index.ts');
const service = getCompanyService();

// 查询深圳某公司（需要真实税号）
const result = await service.getCompanyInfo('91440300MA5XXXXXX', '44');
console.log('企业信息:', result);
```

#### 2. 测试智能税码匹配

```javascript
// 测试税收编码匹配
const { getProductService } = await import('/lib/qixiangyun/index.ts');
const productService = getProductService();

const suggestions = await productService.matchTaxCode('软件开发服务');
console.log('税收编码建议:', suggestions);
```

#### 3. 测试开票功能

在项目中正常使用AI开票功能，系统会自动：
1. 如果配置了 API → 调用真实API开票
2. 如果未配置 → 使用模拟数据（演示模式）

---

## 📊 系统架构

```
┌─────────────────────────────────────────────────┐
│             前端 UI (ChatInterface)              │
│      /app/invoice/page.tsx                       │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│          业务逻辑层 (Business Logic)              │
│   lib/qixiangyun.ts (企业查询)                   │
│   lib/productCatalog.ts (商品管理)               │
│   lib/mockData.ts (客户管理)                     │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│      企享云 API 服务层 (lib/qixiangyun/)          │
│                                                   │
│  ├─ auth.ts         认证鉴权（Token管理）        │
│  ├─ base.ts         基础服务（请求封装）          │
│  ├─ company.ts      企业信息查询                 │
│  ├─ product.ts      商品管理 & 税码匹配          │
│  ├─ customer.ts     客户管理                     │
│  ├─ invoice.ts      发票开具（异步轮询）          │
│  ├─ errors.ts       错误处理                     │
│  └─ types.ts        类型定义                     │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│         企享云 REST API                          │
│      https://mcp.qixiangyun.com                  │
└─────────────────────────────────────────────────┘
```

---

## 🔧 配置说明

### 必需配置项

| 配置项 | 当前状态 | 说明 |
|--------|---------|------|
| `QIXIANGYUN_APPKEY` | ✅ 已配置 | API 访问凭证 |
| `QIXIANGYUN_APPSECRET` | ✅ 已配置 | API 访问密钥 |
| `QIXIANGYUN_AGG_ORG_ID` | ⚠️ 待配置 | 企业ID（从企享云后台获取） |
| `QIXIANGYUN_DEFAULT_NSRSBH` | ⚠️ 待配置 | 您公司的18位税号 |

### 如何获取 aggOrgId？

**方法一**: 登录企享云管理后台
1. 访问 https://www.qixiangyun.com
2. 登录后台管理系统
3. 在"企业设置"或"API管理"中查找

**方法二**: 联系企享云技术支持
- 提供您的 AppKey: `10001995`
- 说明需要查询 aggOrgId

**方法三**: 暂时留空
- 部分功能（如商品查询、客户管理）会受限
- 但企业信息查询和基础开票功能仍可使用

---

## ✅ 功能清单

| 功能模块 | 实现状态 | 说明 |
|---------|---------|------|
| 认证鉴权 | ✅ 完成 | Token自动管理、签名算法 |
| 企业信息查询 | ✅ 完成 | 异步任务轮询、数据映射 |
| 智能税码匹配 | ✅ 完成 | AI推荐税收编码 |
| 商品管理 | ✅ 完成 | 查询、搜索、分类 |
| 客户管理 | ✅ 完成 | 搜索、查询详情 |
| 发票开具 | ✅ 完成 | 同步/异步开票、轮询 |
| 错误处理 | ✅ 完成 | 智能回退、友好提示 |
| 前端集成 | ✅ 完成 | ChatInterface 自动调用 |

---

## 🎨 使用模式

### 模式一：真实API模式（生产环境）

**触发条件**: 配置了完整的环境变量

```env
QIXIANGYUN_APPKEY=10001995
QIXIANGYUN_APPSECRET=abPy4n7MPuPB...
QIXIANGYUN_AGG_ORG_ID=your_org_id
QIXIANGYUN_DEFAULT_NSRSBH=914403...
```

**特点**:
- ✅ 调用真实税局API
- ✅ 生成正式电子发票
- ✅ 数据自动上报税局
- ⚠️ 开票操作不可撤销

### 模式二：模拟数据模式（开发/演示）

**触发条件**: 未配置API凭证或API调用失败

**特点**:
- 📋 使用本地模拟数据
- 📋 模拟开票流程
- 📋 适合开发和演示
- ✅ 安全无风险

### 模式三：混合模式（推荐）

**配置**:
```env
QIXIANGYUN_ENABLE_FALLBACK=true  # 启用回退机制
```

**特点**:
- 🎯 优先使用真实API
- 🔄 失败自动回退到模拟数据
- 🛡️ 确保系统可用性
- 📊 实时查看模式切换日志

---

## 📝 日志说明

系统会在控制台输出详细日志：

```bash
# 认证相关
✅ 从缓存加载 access_token
✅ 成功获取 access_token，有效期: 15 天
✅ 成功刷新 access_token

# API调用
🔍 查询企业信息: 91440300MA5XXXXXX, 地区编码: 44
📤 请求: /v2/public/beginOrgInfoTask
📥 响应: code:2000, success:true
⏳ 轮询中 (1/30)...
✅ 企业信息查询成功: 深圳市XX有限公司

# 开票流程
🎫 开始创建发票...
🎫 调用真实API开票...
⏳ 转为异步处理，任务ID: 202412...
✅ 发票开具成功 (异步): 24440300...

# 错误处理
⚠️ 企享云API查询失败，使用模拟数据
❌ 请求失败: HTTP 500
```

---

## 🚨 重要提醒

### ⚠️ 生产环境警告

**配置真实API后，所有开票操作都会生成真实发票！**

**建议**:
1. 先在测试环境充分验证
2. 开票前仔细核对所有信息
3. 使用小金额进行首次测试
4. 建立开票审核机制
5. 记录所有开票操作日志

### 🔒 安全建议

1. **不要泄露凭证**: `.env.local` 已在 `.gitignore` 中，切勿提交
2. **权限控制**: 限制开票功能的访问权限
3. **数据备份**: 定期备份发票数据
4. **审计日志**: 记录所有API调用

---

## 📚 更多文档

- **完整API文档**: [QIXIANGYUN_API_USAGE.md](./QIXIANGYUN_API_USAGE.md)
- **企享云官方文档**: https://openapi.qixiangyun.com
- **原项目文档**: [README.md](./README.md)

---

## 🎉 完成！

您已经成功集成企享云API！

**下一步**:
1. 配置 `QIXIANGYUN_AGG_ORG_ID` 和 `QIXIANGYUN_DEFAULT_NSRSBH`
2. 重启开发服务器
3. 测试各项功能
4. 准备生产环境部署

有问题？查看控制台日志或参考完整文档。

**祝您使用愉快！** 🚀

