import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Mono } from 'next/font/google'

import './globals.css'

const _inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const _spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
})

export const metadata: Metadata = {
  title: '听歌猜猜猜 - 音乐答题挑战',
  description: '选择粉丝专场或随机专场，听一段旋律猜歌手或歌曲名，测试你的音乐知识！',
}

export const viewport: Viewport = {
  themeColor: '#0f0f14',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${_inter.variable} ${_spaceMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
