'use client'

import { ReactNode, useMemo } from 'react'
import { WagmiProvider, http, createConfig } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'

const shardeumEvmTestnet = {
  id: 8119,
  name: 'Shardeum EVM Testnet',
  nativeCurrency: { name: 'SHM', symbol: 'SHM', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api-mezame.shardeum.org'] },
    public: { http: ['https://api-mezame.shardeum.org'] },
  },
  blockExplorers: {
    default: { name: 'Shardeum Explorer', url: 'https://explorer-mezame.shardeum.org' },
  },
  testnet: true,
} as const

const wagmiConfig = getDefaultConfig({
  appName: 'ShardMint',
  projectId: 'shardmint-temp',
  chains: [shardeumEvmTestnet],
  transports: {
    [shardeumEvmTestnet.id]: http('https://api-mezame.shardeum.org'),
  },
  ssr: true,
})

const queryClient = new QueryClient()

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}


