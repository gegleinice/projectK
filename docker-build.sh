#!/bin/bash

# AI智能开票服务 - 本地 Docker 构建和测试脚本

echo "🚀 开始构建 AI 智能开票服务 Docker 镜像..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

echo -e "${BLUE}📦 构建 Docker 镜像...${NC}"
docker build -t ai-invoice-service:latest .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 镜像构建成功！${NC}"
    echo ""
    
    # 显示镜像信息
    echo -e "${BLUE}📊 镜像信息：${NC}"
    docker images ai-invoice-service:latest
    echo ""
    
    # 询问是否启动容器
    read -p "是否启动容器测试？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 启动容器...${NC}"
        
        # 停止并删除旧容器（如果存在）
        docker stop ai-invoice-service 2>/dev/null
        docker rm ai-invoice-service 2>/dev/null
        
        # 启动新容器
        docker run -d \
          --name ai-invoice-service \
          -p 3008:3008 \
          -e NODE_ENV=production \
          -e PORT=3008 \
          -e NEXT_TELEMETRY_DISABLED=1 \
          --restart always \
          ai-invoice-service:latest
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ 容器启动成功！${NC}"
            echo ""
            echo -e "${GREEN}🌐 应用访问地址: http://localhost:3008${NC}"
            echo ""
            echo "📋 常用命令："
            echo "  查看日志: docker logs -f ai-invoice-service"
            echo "  停止容器: docker stop ai-invoice-service"
            echo "  删除容器: docker rm ai-invoice-service"
            echo "  进入容器: docker exec -it ai-invoice-service sh"
            echo ""
            
            # 等待容器启动
            sleep 3
            
            # 显示日志
            echo -e "${BLUE}📄 容器日志（最近 20 行）：${NC}"
            docker logs --tail 20 ai-invoice-service
        else
            echo -e "${RED}❌ 容器启动失败${NC}"
            exit 1
        fi
    fi
else
    echo -e "${RED}❌ 镜像构建失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 完成！${NC}"






