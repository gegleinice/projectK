# AI智能开票服务 - Dokploy 部署指南

本文档提供在 Dokploy 平台上部署 AI 智能开票服务的完整指南。

## 📋 前置要求

- Dokploy 平台账号
- Git 仓库（GitHub/GitLab/Bitbucket）
- 域名（可选，用于生产环境）

## 🚀 部署步骤

### 方法一：通过 Dokploy Web 界面部署（推荐）

#### 1. 准备代码仓库

首先，将项目推送到 Git 仓库：

```bash
# 初始化 git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "准备部署到 Dokploy"

# 添加远程仓库并推送
git remote add origin <你的仓库地址>
git push -u origin main
```

#### 2. 在 Dokploy 创建新应用

1. 登录 Dokploy 控制台
2. 点击 **"New Application"**
3. 选择 **"Docker"** 作为应用类型
4. 填写应用信息：
   - **Name**: `ai-invoice-service`
   - **Repository**: 选择你的 Git 仓库
   - **Branch**: `main` 或 `master`
   - **Dockerfile Path**: `./Dockerfile`

#### 3. 配置环境变量

在 Dokploy 应用设置中添加以下环境变量：

```env
NODE_ENV=production
PORT=3008
NEXT_TELEMETRY_DISABLED=1
```

#### 4. 配置端口映射

- **Container Port**: `3008`
- **Public Port**: `80` 或 `443`（如果使用 HTTPS）

#### 5. 配置域名（可选）

如果有自己的域名：

1. 在 Dokploy 中添加域名
2. 配置 DNS 记录指向 Dokploy 服务器
3. 启用 SSL/TLS（Dokploy 通常自动配置 Let's Encrypt）

#### 6. 部署应用

点击 **"Deploy"** 按钮，Dokploy 将：
- 克隆代码仓库
- 构建 Docker 镜像
- 启动容器
- 配置反向代理

### 方法二：使用 Dokploy CLI

```bash
# 安装 Dokploy CLI
npm install -g @dokploy/cli

# 登录
dokploy login

# 部署应用
dokploy deploy --config dokploy.yaml
```

### 方法三：手动 Docker 部署

如果你有自己的服务器，可以手动部署：

```bash
# 构建镜像
docker build -t ai-invoice-service .

# 运行容器
docker run -d \
  --name ai-invoice-service \
  -p 3008:3008 \
  -e NODE_ENV=production \
  -e PORT=3008 \
  -e NEXT_TELEMETRY_DISABLED=1 \
  --restart always \
  ai-invoice-service

# 或使用 docker-compose
docker-compose up -d
```

## 🔧 配置说明

### Dockerfile 说明

项目使用多阶段构建优化镜像大小：

- **Stage 1 (deps)**: 安装依赖
- **Stage 2 (builder)**: 构建应用
- **Stage 3 (runner)**: 运行生产版本

最终镜像大小约 150MB。

### 端口配置

- **开发环境**: 3008
- **生产环境**: 3008（内部），通过反向代理映射到 80/443

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `3008` |
| `NEXT_TELEMETRY_DISABLED` | 禁用遥测 | `1` |
| `HOSTNAME` | 监听地址 | `0.0.0.0` |

## 📊 健康检查

Dokploy 会自动配置健康检查：

- **检查路径**: `/`
- **检查间隔**: 30秒
- **超时时间**: 10秒
- **重试次数**: 3次

## 🔍 监控和日志

### 查看日志

在 Dokploy 控制台：
1. 进入应用详情页
2. 点击 **"Logs"** 标签
3. 实时查看应用日志

或使用 Docker 命令：

```bash
# 查看实时日志
docker logs -f ai-invoice-service

# 查看最近 100 行日志
docker logs --tail 100 ai-invoice-service
```

### 监控指标

Dokploy 提供以下监控指标：
- CPU 使用率
- 内存使用率
- 网络流量
- 响应时间

## 🚨 故障排除

### 问题 1: 构建失败

**症状**: Docker 构建过程中报错

**解决方案**:
```bash
# 清理 Docker 缓存
docker builder prune -a

# 重新构建
docker build --no-cache -t ai-invoice-service .
```

### 问题 2: 应用无法访问

**症状**: 部署成功但无法访问

**检查步骤**:
1. 检查容器是否运行: `docker ps`
2. 检查日志: `docker logs ai-invoice-service`
3. 检查端口映射: `docker port ai-invoice-service`
4. 检查防火墙规则

### 问题 3: 内存不足

**症状**: 容器频繁重启

**解决方案**:
```yaml
# 在 docker-compose.yml 中增加内存限制
deploy:
  resources:
    limits:
      memory: 1G
```

### 问题 4: 构建很慢

**优化方案**:
1. 使用国内镜像源
2. 添加 `.dockerignore` 文件
3. 使用 Docker 缓存层

## 🔄 更新部署

### 自动部署（推荐）

在 Dokploy 中配置 Webhook：
1. 在 Git 仓库设置中添加 Webhook
2. 使用 Dokploy 提供的 Webhook URL
3. 每次推送代码时自动触发部署

### 手动部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建并部署
docker-compose up -d --build
```

## 📈 性能优化

### 1. 启用 Gzip 压缩

已在 `next.config.js` 中配置：
```javascript
compress: true
```

### 2. 使用 CDN

建议将静态资源部署到 CDN：
- 图片
- 字体文件
- CSS/JS 文件

### 3. 数据库连接池

如果使用数据库，配置连接池：
```javascript
pool: {
  min: 2,
  max: 10
}
```

### 4. Redis 缓存

可选：添加 Redis 用于缓存：
```yaml
services:
  redis:
    image: redis:alpine
    restart: always
```

## 🔒 安全建议

1. **使用环境变量管理敏感信息**
   - 不要在代码中硬编码 API 密钥
   - 使用 Dokploy 的环境变量功能

2. **启用 HTTPS**
   - Dokploy 自动配置 Let's Encrypt
   - 强制重定向 HTTP 到 HTTPS

3. **限制资源使用**
   - 设置 CPU 和内存限制
   - 防止资源耗尽

4. **定期更新依赖**
   ```bash
   npm audit
   npm update
   ```

## 📱 访问应用

部署成功后，可以通过以下方式访问：

- **本地测试**: `http://localhost:3008`
- **Dokploy 默认域名**: `https://ai-invoice-service.dokploy.app`
- **自定义域名**: `https://yourdomain.com`

## 📞 支持

如遇到问题：
1. 查看 [Dokploy 文档](https://docs.dokploy.com)
2. 查看应用日志
3. 检查 Docker 容器状态

## 🎉 部署完成

恭喜！您的 AI 智能开票服务已成功部署到 Dokploy！

### 下一步

- [ ] 配置自定义域名
- [ ] 设置监控告警
- [ ] 配置数据库（如需要）
- [ ] 设置自动备份
- [ ] 配置 CI/CD 流程

---

**版本**: 1.0.0  
**最后更新**: 2025-12-03


