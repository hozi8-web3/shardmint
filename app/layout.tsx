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
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS fallback */
            body { margin: 0; padding: 0; font-family: Inter, system-ui, sans-serif; }
            .min-h-screen { min-height: 100vh; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .container { max-width: 1200px; margin: 0 auto; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
            .text-center { text-align: center; }
            .mb-12 { margin-bottom: 3rem; }
            .bg-white { background-color: white; }
            .rounded-xl { border-radius: 0.75rem; }
            .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
            .p-6 { padding: 1.5rem; }
            .bg-gradient-to-br { background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%); }
            .from-blue-50 { background-color: #eff6ff; }
            .to-indigo-100 { background-color: #e0e7ff; }
          `
        }} />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {children}
        </div>
      </body>
    </html>
  )
}
