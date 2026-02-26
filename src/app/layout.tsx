import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/next";
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '飞书数据同步平台',
    template: '%s | 飞书数据同步平台',
  },
  description:
    '飞书数据同步平台 - 用于同步和管理飞书多维表格数据，实现数据的快速处理和分析。',
  keywords: [
    '飞书',
    '数据同步',
    '飞书表格',
    '多维表格',
    '数据管理',
    '表格同步',
    '飞书API',
  ],
  authors: [{ name: 'Feishu Sync Team' }],
  generator: 'Next.js',
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: '飞书数据同步平台',
    description:
      '飞书数据同步平台 - 高效管理和同步飞书表格数据',
    locale: 'zh_CN',
    type: 'website',
    // images: [
    //   {
    //     url: '',
    //     width: 1200,
    //     height: 630,
    //     alt: '飞书数据同步平台',
    //   },
    // ],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="en">
      <body className={`antialiased`}>
        <Analytics />
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
