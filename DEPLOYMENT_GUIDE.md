# AI智能开票服务 - 完整部署指南

> 本指南记录了从零到生产环境的完整部署流程，适用于 Ubuntu 服务器。

## 📋 目录

- [准备工作](#准备工作)
- [本地环境准备](#本地环境准备)
- [服务器部署](#服务器部署)
- [验证部署](#验证部署)
- [日常管理](#日常管理)
- [更新应用](#更新应用)
- [故障排查](#故障排查)

---

## 🎯 准备工作

### 1. 服务器信息

在开始部署前，请准备以下信息：

```
服务器 IP: xxx.xxx.xxx.xxx
用户名: root
密码: **********
SSH 端口: 22
```

### 2. 本地工具安装

在 macOS 上安装必要的工具：

```bash
# 安装 Homebrew（如果还没安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 sshpass（用于密码认证）
brew install sshpass
```

### 3. GitHub 仓库

确保代码已推送到 GitHub 仓库。

---

## 💻 本地环境准备

### 步骤 1: 初始化 Git 仓库

如果项目还不是 Git 仓库：

```bash
# 进入项目目录
cd /path/to/your/project

# 初始化 Git
git init

# 创建 .gitignore 文件
cat > .gitignore << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
EOF

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit for deployment"
```

### 步骤 2: 推送到 GitHub

```bash
# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/your-username/your-repo.git

# 推送代码
git push -u origin main
```

### 步骤 3: 检查 Dockerfile

确保项目根目录有 `Dockerfile`，内容如下：

```dockerfile
# 使用官方 Node.js 镜像作为基础镜像
FROM node:18-alpine AS base

# 安装依赖阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制依赖文件
COPY package.json yarn.lock* package-lock.json* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1

# 构建应用
RUN yarn build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
# 创建 public 目录（如果不存在）
RUN mkdir -p ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3008

ENV PORT=3008
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "server.js"]
```

### 步骤 4: 检查 next.config.js

确保 `next.config.js` 包含 `output: 'standalone'`：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 启用 standalone 输出模式，优化 Docker 镜像大小
  output: 'standalone',
  // 压缩
  compress: true,
  // 生产环境优化
  swcMinify: true,
}

module.exports = nextConfig
```

---

## 🚀 服务器部署

### 方案 A: 使用一键部署脚本（推荐）

#### 1. 创建部署脚本

在本地创建 `deploy-to-server.sh`：

```bash
#!/bin/bash
set -e

# 配置变量
SERVER_IP="107.174.71.13"  # 替换为你的服务器 IP
SERVER_USER="root"
SERVER_PASSWORD="ZQL741xbN7Ye5euaU4"  # 替换为你的密码
GITHUB_REPO="https://github.com/gegleinice/projectK.git"  # 替换为你的仓库
APP_NAME="ai-invoice-service"
APP_PORT="3008"
PUBLIC_PORT="80"

echo "🚀 开始部署 $APP_NAME 到服务器 $SERVER_IP"

# 创建远程部署脚本
cat > /tmp/remote_deploy.sh << 'EOFSCRIPT'
#!/bin/bash
set -e

echo "=== 1. 检查并安装 Docker ==="
if ! command -v docker &> /dev/null; then
    echo "Docker 未安装，开始安装..."
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
else
    echo "Docker 已安装: $(docker --version)"
fi

echo "=== 2. 安装 Git ==="
apt-get install -y git

echo "=== 3. 克隆/更新代码 ==="
cd /root
if [ -d "AIAccounting" ]; then
    echo "代码目录已存在，拉取最新代码..."
    cd AIAccounting
    git pull origin main
else
    echo "克隆代码仓库..."
    git clone GITHUB_REPO AIAccounting
    cd AIAccounting
fi

echo "=== 4. 构建 Docker 镜像 ==="
docker build -t APP_NAME .

echo "=== 5. 停止并删除旧容器 ==="
docker stop APP_NAME 2>/dev/null || true
docker rm APP_NAME 2>/dev/null || true

echo "=== 6. 启动新容器 ==="
docker run -d \
  --name APP_NAME \
  -p PUBLIC_PORT:APP_PORT \
  -p APP_PORT:APP_PORT \
  -e NODE_ENV=production \
  -e PORT=APP_PORT \
  -e NEXT_TELEMETRY_DISABLED=1 \
  --restart always \
  APP_NAME

echo "=== 7. 检查容器状态 ==="
sleep 3
docker ps | grep APP_NAME

echo ""
echo "✅ 部署完成！"
echo "📍 访问地址: http://SERVER_IP"
echo "📍 备用地址: http://SERVER_IP:APP_PORT"
EOFSCRIPT

# 替换变量
sed -i '' "s|GITHUB_REPO|$GITHUB_REPO|g" /tmp/remote_deploy.sh
sed -i '' "s|APP_NAME|$APP_NAME|g" /tmp/remote_deploy.sh
sed -i '' "s|APP_PORT|$APP_PORT|g" /tmp/remote_deploy.sh
sed -i '' "s|PUBLIC_PORT|$PUBLIC_PORT|g" /tmp/remote_deploy.sh
sed -i '' "s|SERVER_IP|$SERVER_IP|g" /tmp/remote_deploy.sh

# 上传脚本到服务器
echo "📤 上传部署脚本到服务器..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no /tmp/remote_deploy.sh $SERVER_USER@$SERVER_IP:/root/deploy.sh

# 执行部署脚本
echo "🔧 在服务器上执行部署..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP 'chmod +x /root/deploy.sh && /root/deploy.sh'

echo ""
echo "🎉 部署完成！"
echo "📍 访问地址: http://$SERVER_IP"
```

#### 2. 执行部署

```bash
# 赋予执行权限
chmod +x deploy-to-server.sh

# 执行部署
./deploy-to-server.sh
```

### 方案 B: 手动分步部署

#### 1. 连接到服务器

```bash
ssh root@107.174.71.13
```

#### 2. 安装 Docker

```bash
# 更新包管理器
apt-get update

# 安装必要的工具
apt-get install -y ca-certificates curl gnupg

# 添加 Docker 的官方 GPG 密钥
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# 设置仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker
systemctl enable docker
systemctl start docker

# 验证安装
docker --version
```

#### 3. 安装 Git 并克隆代码

```bash
# 安装 Git
apt-get install -y git

# 克隆代码
cd /root
git clone https://github.com/gegleinice/projectK.git AIAccounting
cd AIAccounting
```

#### 4. 构建 Docker 镜像

```bash
docker build -t ai-invoice-service .
```

#### 5. 启动容器

```bash
# 停止旧容器（如果存在）
docker stop ai-invoice-service 2>/dev/null || true
docker rm ai-invoice-service 2>/dev/null || true

# 启动新容器
docker run -d \
  --name ai-invoice-service \
  -p 80:3008 \
  -p 3008:3008 \
  -e NODE_ENV=production \
  -e PORT=3008 \
  -e NEXT_TELEMETRY_DISABLED=1 \
  --restart always \
  ai-invoice-service
```

#### 6. 检查状态

```bash
# 查看容器状态
docker ps | grep ai-invoice-service

# 查看日志
docker logs -f ai-invoice-service
```

---

## ✅ 验证部署

### 1. 从本地测试

```bash
# 测试 HTTP 响应
curl -I http://107.174.71.13

# 应该看到 HTTP/1.1 200 OK
```

### 2. 浏览器访问

在浏览器中打开：
- http://107.174.71.13
- http://107.174.71.13:3008

### 3. 查看服务器日志

```bash
ssh root@107.174.71.13
docker logs -f ai-invoice-service
```

---

## 🔧 日常管理

### 查看容器状态

```bash
ssh root@107.174.71.13
docker ps
```

### 查看实时日志

```bash
ssh root@107.174.71.13
docker logs -f ai-invoice-service
```

### 查看最近 100 行日志

```bash
ssh root@107.174.71.13
docker logs --tail 100 ai-invoice-service
```

### 重启容器

```bash
ssh root@107.174.71.13
docker restart ai-invoice-service
```

### 停止容器

```bash
ssh root@107.174.71.13
docker stop ai-invoice-service
```

### 启动容器

```bash
ssh root@107.174.71.13
docker start ai-invoice-service
```

### 查看容器资源使用

```bash
ssh root@107.174.71.13
docker stats ai-invoice-service
```

---

## 🔄 更新应用

### 方式 1: 使用部署脚本

直接运行部署脚本即可：

```bash
./deploy-to-server.sh
```

### 方式 2: 手动更新

#### 1. 本地推送代码

```bash
# 在本地项目目录
git add .
git commit -m "Update: 描述你的更改"
git push origin main
```

#### 2. 服务器拉取并重新部署

```bash
ssh root@107.174.71.13

# 进入项目目录
cd /root/AIAccounting

# 拉取最新代码
git pull origin main

# 重新构建镜像
docker build -t ai-invoice-service .

# 停止并删除旧容器
docker stop ai-invoice-service
docker rm ai-invoice-service

# 启动新容器
docker run -d \
  --name ai-invoice-service \
  -p 80:3008 \
  -p 3008:3008 \
  -e NODE_ENV=production \
  -e PORT=3008 \
  -e NEXT_TELEMETRY_DISABLED=1 \
  --restart always \
  ai-invoice-service

# 检查状态
docker ps | grep ai-invoice-service
```

### 方式 3: 零停机更新（高级）

使用蓝绿部署：

```bash
ssh root@107.174.71.13

cd /root/AIAccounting
git pull origin main

# 构建新镜像（使用新标签）
docker build -t ai-invoice-service:new .

# 启动新容器（使用不同端口）
docker run -d \
  --name ai-invoice-service-new \
  -p 3009:3008 \
  -e NODE_ENV=production \
  -e PORT=3008 \
  -e NEXT_TELEMETRY_DISABLED=1 \
  --restart always \
  ai-invoice-service:new

# 等待新容器启动（约10秒）
sleep 10

# 测试新容器
curl -I http://localhost:3009

# 如果测试成功，切换端口
docker stop ai-invoice-service
docker rm ai-invoice-service

# 停止临时容器
docker stop ai-invoice-service-new
docker rm ai-invoice-service-new

# 启动最终容器
docker run -d \
  --name ai-invoice-service \
  -p 80:3008 \
  -p 3008:3008 \
  -e NODE_ENV=production \
  -e PORT=3008 \
  -e NEXT_TELEMETRY_DISABLED=1 \
  --restart always \
  ai-invoice-service:new

# 清理旧镜像
docker image prune -f
```

---

## 🔍 故障排查

### 问题 1: 容器无法启动

**症状**：执行 `docker ps` 看不到容器

**排查步骤**：

```bash
# 查看所有容器（包括停止的）
docker ps -a

# 查看容器日志
docker logs ai-invoice-service

# 检查镜像是否存在
docker images | grep ai-invoice-service
```

**常见原因**：
- 端口被占用
- 镜像构建失败
- 配置错误

### 问题 2: 无法访问服务

**症状**：浏览器无法打开网页

**排查步骤**：

```bash
# 1. 检查容器状态
docker ps | grep ai-invoice-service

# 2. 检查端口映射
docker port ai-invoice-service

# 3. 在服务器本地测试
curl http://localhost:3008

# 4. 检查防火墙
ufw status

# 5. 检查容器日志
docker logs ai-invoice-service
```

**解决方案**：

```bash
# 开放端口（如果防火墙阻止）
ufw allow 80
ufw allow 3008
```

### 问题 3: 构建失败

**症状**：`docker build` 报错

**排查步骤**：

```bash
# 查看详细错误
docker build -t ai-invoice-service . --no-cache

# 检查 Dockerfile 语法
cat Dockerfile

# 检查依赖文件是否存在
ls -la package.json yarn.lock
```

**常见原因**：
- 依赖安装失败（网络问题）
- Dockerfile 语法错误
- 缺少必要文件

### 问题 4: 内存不足

**症状**：容器频繁重启

**排查步骤**：

```bash
# 查看系统资源
free -h
df -h

# 查看 Docker 资源使用
docker stats

# 查看容器日志
docker logs ai-invoice-service | grep -i "memory\|killed"
```

**解决方案**：

```bash
# 限制容器内存使用
docker run -d \
  --name ai-invoice-service \
  --memory="512m" \
  --memory-swap="1g" \
  -p 80:3008 \
  -p 3008:3008 \
  -e NODE_ENV=production \
  -e PORT=3008 \
  -e NEXT_TELEMETRY_DISABLED=1 \
  --restart always \
  ai-invoice-service
```

### 问题 5: Git 拉取失败

**症状**：`git pull` 报错

**解决方案**：

```bash
# 重置本地更改
cd /root/AIAccounting
git reset --hard
git clean -fd

# 重新拉取
git pull origin main

# 如果还是失败，重新克隆
cd /root
rm -rf AIAccounting
git clone https://github.com/gegleinice/projectK.git AIAccounting
```

---

## 📊 监控和维护

### 设置日志轮转

创建 `/etc/docker/daemon.json`：

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

重启 Docker：

```bash
systemctl restart docker
```

### 定期清理

```bash
# 清理未使用的镜像
docker image prune -a -f

# 清理未使用的容器
docker container prune -f

# 清理未使用的卷
docker volume prune -f

# 一键清理所有未使用资源
docker system prune -a -f
```

### 自动备份脚本

创建 `/root/backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份代码
cd /root
tar -czf $BACKUP_DIR/code_$DATE.tar.gz AIAccounting

# 保留最近 7 天的备份
find $BACKUP_DIR -name "code_*.tar.gz" -mtime +7 -delete

echo "Backup completed: code_$DATE.tar.gz"
```

设置定时任务：

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点备份
0 2 * * * /root/backup.sh >> /var/log/backup.log 2>&1
```

---

## 🔒 安全建议

### 1. 修改 SSH 端口

```bash
# 编辑 SSH 配置
nano /etc/ssh/sshd_config

# 修改端口（例如改为 2222）
Port 2222

# 重启 SSH
systemctl restart sshd
```

### 2. 禁用 Root 密码登录

```bash
# 先设置 SSH 密钥登录
ssh-copy-id root@107.174.71.13

# 然后修改配置
nano /etc/ssh/sshd_config

# 设置
PasswordAuthentication no

# 重启 SSH
systemctl restart sshd
```

### 3. 启用防火墙

```bash
# 安装 ufw
apt-get install -y ufw

# 允许必要端口
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3008/tcp

# 启用防火墙
ufw enable
```

### 4. 设置自动安全更新

```bash
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## 📝 部署清单

在部署前，请确认以下内容：

- [ ] 服务器信息已准备（IP、用户名、密码）
- [ ] 本地已安装 Git
- [ ] 本地已安装 sshpass（macOS）
- [ ] 代码已推送到 GitHub
- [ ] Dockerfile 已准备并测试
- [ ] next.config.js 包含 `output: 'standalone'`
- [ ] 服务器可以访问 GitHub
- [ ] 服务器防火墙已配置

---

## 📞 联系支持

如遇问题，请检查：
1. 容器日志：`docker logs ai-invoice-service`
2. 系统日志：`journalctl -u docker -f`
3. 网络连接：`curl http://localhost:3008`

---

## 📚 参考资料

- [Docker 官方文档](https://docs.docker.com/)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Ubuntu 服务器指南](https://ubuntu.com/server/docs)

---

**版本**: 1.0.0  
**最后更新**: 2025-12-03  
**适用系统**: Ubuntu 24.04 LTS  
**测试服务器**: 107.174.71.13


