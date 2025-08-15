'use client'

import { useState } from 'react'

interface HeaderProps {
  isConnected: boolean
  account: string
  onConnect: () => void
}

export default function Header({ isConnected, account, onConnect }: HeaderProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setIsConnecting(true)
      try {
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        })
        
        // Check if we're on the right network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        
        if (chainId !== '0x1f90') { // 8080 in hex
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x1f90' }],
            })
          } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x1f90',
                  chainName: 'Shardeum Unstablenet',
                  nativeCurrency: {
                    name: 'SHM',
                    symbol: 'SHM',
                    decimals: 18
                  },
                  rpcUrls: ['https://api-unstable.shardeum.org'],
                  blockExplorerUrls: ['https://explorer-unstable.shardeum.org']
                }]
              })
            }
          }
        }
        
        onConnect()
      } catch (error) {
        console.error('Error connecting wallet:', error)
      } finally {
        setIsConnecting(false)
      }
    } else {
      alert('Please install MetaMask to use this dApp!')
    }
  }

  const disconnectWallet = () => {
    // In a real app, you might want to clear some state
    window.location.reload()
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

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
                Shardeum Unstablenet
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              ⚡ Legacy Format
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  Connected: {shortenAddress(account)}
                </div>
                <button
                  onClick={disconnectWallet}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
