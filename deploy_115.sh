#!/bin/bash
# 一键部署脚本 - 115.190.196.243

echo "🚀 开始部署到 115.190.196.243..."

# 服务器信息
SERVER="115.190.196.243"
USER="root"
PASSWORD="autoagents@2023"

# 使用 sshpass 连接并执行部署
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -T $USER@$SERVER << 'ENDSSH'
echo "📦 进入项目目录..."
cd /root/AIAccounting

echo "📥 拉取最新代码..."
git fetch origin
git reset --hard origin/main

echo "🛑 停止旧容器..."
docker stop aiaccounting 2>/dev/null || true
docker rm aiaccounting 2>/dev/null || true

echo "🔨 构建新镜像..."
docker build -t aiaccounting:latest .

echo "🚀 启动新容器..."
docker run -d --name aiaccounting -p 3008:3000 --restart unless-stopped aiaccounting:latest

echo "⏳ 等待服务启动..."
sleep 5

echo "📊 检查运行状态..."
docker ps | grep aiaccounting

echo ""
echo "✅ 部署完成！"
echo "🌐 访问地址: http://115.190.196.243:3008"
ENDSSH

echo "🎉 脚本执行完毕！"





