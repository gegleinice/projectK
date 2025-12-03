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

