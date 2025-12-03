import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI智能开票服务 - 让财税工作更简单',
  description: '智能化发票开具系统 - 自然语言交互',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}
