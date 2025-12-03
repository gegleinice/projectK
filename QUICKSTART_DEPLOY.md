# 🚀 快速部署指南

## 部署到 Dokploy（推荐）

### 1️⃣ 准备工作

确保已经创建了以下文件（已完成）：
- ✅ `Dockerfile` - Docker 镜像配置
- ✅ `.dockerignore` - Docker 构建忽略文件
- ✅ `dokploy.yaml` - Dokploy 配置
- ✅ `docker-compose.yml` - Docker Compose 配置
- ✅ `next.config.js` - Next.js 优化配置

### 2️⃣ 推送代码到 Git

```bash
# 添加所有文件
git add .

# 提交
git commit -m "添加 Dokploy 部署配置"

# 推送到远程仓库
git push origin main
```

### 3️⃣ 在 Dokploy 部署

**选项 A: 通过 Web 界面**

1. 登录 Dokploy：https://app.dokploy.com
2. 点击 "New Application"
3. 选择你的 Git 仓库
4. 填写配置：
   - **Name**: `ai-invoice-service`
   - **Type**: Docker
   - **Branch**: main
   - **Port**: 3008
5. 点击 "Deploy" 开始部署

**选项 B: 使用命令行**

```bash
# 安装 Dokploy CLI
npm install -g @dokploy/cli

# 登录
dokploy login

# 部署
dokploy deploy
```

### 4️⃣ 访问应用

部署成功后，访问：
- Dokploy 默认域名：`https://ai-invoice-service.dokploy.app`
- 或自定义域名（如已配置）

---

## 本地 Docker 测试

### 快速测试（自动化脚本）

```bash
# 运行构建脚本
./docker-build.sh
```

### 手动步骤

```bash
# 1. 构建镜像
docker build -t ai-invoice-service .

# 2. 运行容器
docker run -d \
  --name ai-invoice-service \
  -p 3008:3008 \
  -e NODE_ENV=production \
  ai-invoice-service

# 3. 查看日志
docker logs -f ai-invoice-service

# 4. 访问应用
# 浏览器打开: http://localhost:3008
```

### 使用 Docker Compose

```bash
# 启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

---

## 环境变量配置

在 Dokploy 或 `.env` 文件中配置：

```env
NODE_ENV=production
PORT=3008
NEXT_TELEMETRY_DISABLED=1
```

---

## 常见命令

### Docker 命令

```bash
# 查看运行中的容器
docker ps

# 查看日志
docker logs ai-invoice-service

# 进入容器
docker exec -it ai-invoice-service sh

# 停止容器
docker stop ai-invoice-service

# 删除容器
docker rm ai-invoice-service

# 删除镜像
docker rmi ai-invoice-service
```

### Dokploy 命令

```bash
# 查看应用状态
dokploy status

# 查看日志
dokploy logs ai-invoice-service

# 重启应用
dokploy restart ai-invoice-service

# 查看环境变量
dokploy env list
```

---

## 故障排除

### 构建失败

```bash
# 清理缓存重新构建
docker build --no-cache -t ai-invoice-service .
```

### 容器无法启动

```bash
# 查看详细日志
docker logs ai-invoice-service

# 检查端口是否被占用
lsof -i :3008
```

### 内存不足

编辑 `docker-compose.yml`，增加内存限制：

```yaml
deploy:
  resources:
    limits:
      memory: 1G
```

---

## 📚 完整文档

详细部署指南请查看：[DEPLOY_DOKPLOY.md](./DEPLOY_DOKPLOY.md)

---

## ✅ 部署检查清单

部署前确认：

- [ ] 已推送代码到 Git 仓库
- [ ] 已配置环境变量
- [ ] 已测试 Docker 本地构建
- [ ] 已配置域名（可选）
- [ ] 已设置健康检查

部署后确认：

- [ ] 应用可以正常访问
- [ ] 日志没有错误
- [ ] 功能测试通过
- [ ] 性能监控正常

---

**需要帮助？** 查看完整文档或联系技术支持。

