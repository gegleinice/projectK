# 🚀 企享云 API 配置指南

## 快速配置 (5分钟)

### 步骤 1: 获取 API 凭证

1. 访问 [企享云开放平台](https://openapi.qixiangyun.com)
2. 注册/登录账号
3. 进入"应用管理"获取:
   - `AppKey` (客户端密钥)
   - `AppSecret` (客户端密钥)

### 步骤 2: 配置环境变量

在项目根目录创建 `.env.local` 文件:

```env
# 企享云 API 配置
NEXT_PUBLIC_QIXIANGYUN_APP_KEY=your_app_key_here
NEXT_PUBLIC_QIXIANGYUN_APP_SECRET=your_app_secret_here
QIXIANGYUN_API_BASE_URL=https://api.qixiangyun.com
```

**示例** (替换为你的真实值):
```env
NEXT_PUBLIC_QIXIANGYUN_APP_KEY=10001990
NEXT_PUBLIC_QIXIANGYUN_APP_SECRET=abc123def456
QIXIANGYUN_API_BASE_URL=https://api.qixiangyun.com
```

### 步骤 3: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

---

## ✅ 验证配置

### 方法 1: 查看控制台
启动后如果看到以下日志，说明配置成功：
```
✅ Qixiangyun API configured
```

### 方法 2: 测试企业查询
1. 访问 `http://localhost:3000/user/bindcompany`
2. 搜索企业名称
3. 如果能正常返回企业信息，说明API工作正常

### 方法 3: 浏览器控制台
打开浏览器开发者工具 (F12)，在 Console 中输入:
```javascript
localStorage.getItem('qxy_token_cache')
```
如果有值返回，说明 Token 已成功获取和缓存

---

## 🔧 常见问题

### 问题 1: "Missing Qixiangyun credentials"
**原因**: 环境变量未配置或格式错误

**解决**:
1. 确认 `.env.local` 文件在项目根目录
2. 检查变量名是否正确 (区分大小写)
3. 重启开发服务器

### 问题 2: "Token 获取失败"
**原因**: AppKey 或 AppSecret 错误

**解决**:
1. 登录企享云平台确认密钥
2. AppSecret 无需手动MD5，系统会自动处理
3. 检查是否有特殊字符需要转义

### 问题 3: "企业信息查询失败"
**原因**: 地区编码不正确

**解决**:
1. 确认企业所在地区
2. 常用地区编码:
   - 北京: `11`
   - 上海: `31`
   - 浙江: `33`
   - 广东: `44`
   - 深圳: `4403`

---

## 🎯 配置检查清单

使用前请确认:

- [ ] 已从企享云平台获取 AppKey
- [ ] 已从企享云平台获取 AppSecret  
- [ ] 已创建 `.env.local` 文件
- [ ] 环境变量格式正确
- [ ] 已重启开发服务器
- [ ] 浏览器控制台无错误
- [ ] 能够正常查询企业信息

---

## 📞 获取帮助

如遇到问题:

1. **查看错误日志**: 浏览器 Console (F12)
2. **检查网络**: 开发者工具 Network 标签
3. **查看文档**: `QIXIANGYUN_API_INTEGRATION.md`
4. **联系技术支持**: [企享云工单系统](https://openapi.qixiangyun.com)

---

## 💡 快速测试命令

在项目根目录执行:

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器
open http://localhost:3000/user/bindcompany
```

---

**配置完成后，你的系统将自动连接到企享云API，实现真实的发票开具功能！** 🎉

