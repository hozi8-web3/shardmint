import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ShardMint - Mint Tokens on Shardeum',
  description: 'Deploy your own ERC-20 token on Shardeum Unstablenet',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/logo-large.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'ShardMint - Mint Tokens on Shardeum',
    description: 'Deploy your own ERC-20 token on Shardeum Unstablenet',
    images: ['/og-image.svg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShardMint - Mint Tokens on Shardeum',
    description: 'Deploy your own ERC-20 token on Shardeum Unstablenet',
    images: ['/og-image.svg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {children}
        </div>
      </body>
    </html>
  )
}
