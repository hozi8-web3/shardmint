"use client"

import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Header() {
  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img src="/logo.svg" alt="ShardMint Logo" className="w-8 h-8" />
              <span className="text-2xl font-bold text-primary-600">ShardMint</span>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                Shardeum EVM Testnet
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ConnectButton chainStatus="icon" showBalance={false} />
          </div>
        </div>
      </div>
    </header>
  )
}
