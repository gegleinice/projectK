#!/bin/bash

# AI智能开票服务 - 启动脚本
# 如果在Cursor中无法启动，请在系统终端中运行此脚本

echo "🚀 正在启动AI智能开票服务..."
echo ""

# 进入项目目录
cd "$(dirname "$0")"

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
  echo "📦 首次运行，正在安装依赖..."
  yarn install || npm install
fi

# 修复权限问题
echo "🔧 修复文件权限..."
chmod -R 755 node_modules 2>/dev/null || true
xattr -cr node_modules 2>/dev/null || true

# 启动开发服务器
echo "✨ 启动开发服务器..."
echo ""
echo "访问地址: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 优先使用yarn，如果失败则使用npx
if command -v yarn &> /dev/null; then
  yarn dev
else
  npx next dev
fi


