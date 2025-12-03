# AI智能开票服务

基于Next.js + TypeScript + Tailwind CSS构建的智能发票开具系统，支持自然语言交互和智能闭环处理。

## 功能特性

### 1. 预置引导与极简录入
- 对话式Chatbot UI交互界面
- 输入框预置提示（Ghost Text），引导用户提供核心要素
- 即时响应，10秒内反馈处理状态

### 2. 自然语言解析
- 自动提取5大关键字段：
  - 收票方（客户名称）
  - 金额
  - 数量
  - 单价
  - 商品类型
- 后台自动逻辑校验：数量 × 单价 = 金额
- 异常检测与红色气泡提示

### 3. 智能匹配与补全
- **客户信息自动补全**：基于Mock数据库，识别常用客户（腾讯、阿里、字节、华为等）
- **税率智能匹配**：根据商品类型自动匹配税率（6% 或 13%）
- **历史模板调用**：根据客户+商品组合调取历史开票习惯

### 4. 实时发票预览
- 右侧实时显示发票样式
- 符合增值税电子普通发票格式
- 包含完整的购买方、销售方信息和明细

## 技术栈

- **框架**：Next.js 14 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **图标**：Lucide React
- **开发环境**：Node.js 18+

## 快速开始

### 本地开发

#### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

#### 启动开发服务器

```bash
# 使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

访问 [http://localhost:3008](http://localhost:3008) 查看应用。

#### 构建生产版本

```bash
npm run build
npm start
```

### 部署到 Dokploy

#### 快速部署

1. **推送代码到 Git 仓库**
```bash
git add .
git commit -m "准备部署"
git push origin main
```

2. **在 Dokploy 创建应用**
   - 登录 [Dokploy](https://app.dokploy.com)
   - 点击 "New Application"
   - 选择你的 Git 仓库
   - 配置端口: `3008`
   - 点击 "Deploy"

3. **访问应用**
   - Dokploy 默认域名：`https://ai-invoice-service.dokploy.app`
   - 或配置自定义域名

#### Docker 本地测试

```bash
# 使用自动化脚本
./docker-build.sh

# 或手动构建
docker build -t ai-invoice-service .
docker run -d -p 3008:3008 ai-invoice-service

# 使用 Docker Compose
docker-compose up -d
```

📚 **详细部署指南**: 
- [Dokploy 部署完整教程](./DEPLOY_DOKPLOY.md)
- [快速部署指南](./QUICKSTART_DEPLOY.md)

## 使用示例

在对话框中输入以下格式的自然语言：

```
请帮我开票：给腾讯开软件服务，金额50000元，数量5个，单价10000元/个
```

系统将自动：
1. 解析提取关键信息
2. 校验逻辑（5 × 10000 = 50000）
3. 自动补全腾讯的完整企业信息（税号、地址、电话、开户行等）
4. 匹配软件服务的6%税率
5. 计算税额和价税合计
6. 在右侧实时生成发票预览

## Mock数据说明

### 预置客户
- 腾讯（深圳市腾讯计算机系统有限公司）
- 阿里（阿里巴巴(中国)有限公司）
- 字节（北京字节跳动科技有限公司）
- 华为（华为技术有限公司）

### 支持的商品类型
- **现代服务类**（6%税率）：软件服务、技术服务、咨询服务、云服务
- **货物销售类**（13%税率）：电子产品、硬件设备、办公用品

## 项目结构

```
AIAccounting/
├── app/
│   ├── page.tsx           # 主页面
│   ├── layout.tsx         # 布局组件
│   └── globals.css        # 全局样式
├── components/
│   ├── ChatInterface.tsx  # 对话界面组件
│   └── InvoicePreview.tsx # 发票预览组件
├── lib/
│   ├── mockData.ts        # Mock数据（客户、商品类型、模板）
│   └── invoiceParser.ts   # 解析器（NLU、校验、补全）
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 核心功能实现

### 自然语言解析
使用正则表达式和关键词匹配，从用户输入中提取：
- 客户名称（支持"给XXX开"、"客户：XXX"等模式）
- 金额（支持"金额XXX元"、"XXX元"等模式）
- 数量（支持"数量XXX个"、"XXX个"等模式）
- 单价（支持"单价XXX元"、"每个XXX元"等模式）
- 商品类型（通过关键词匹配）

### 逻辑校验
- 检查数量 × 单价 = 金额的数学逻辑
- 如果只提供两个值，自动计算第三个
- 如果三个值都提供但不符合逻辑，显示错误提示

### 智能补全
1. **客户信息补全**：通过关键词匹配Mock客户库
2. **税率匹配**：根据商品类型自动分配税率
3. **税额计算**：金额 × 税率 = 税额
4. **模板调用**：根据历史记录推荐常用单价

## 演示准备

### DDL：本周四（2025-11-27）
- ✅ 完成核心功能开发
- ✅ 实现预置引导 → 自然语言解析 → 智能闭环流程
- ✅ 创建Mock数据和预览界面

### 周五沟通对象
- 高哥
- 企享云相关同事

## 开发者

Ray Steve @ 企享云科技

## 许可证

MIT


