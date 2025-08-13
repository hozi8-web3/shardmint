'use client'

import { useState, useEffect } from 'react'
import TokenDeployer from '../components/TokenDeployer'
import Header from '../components/Header'
import Footer from '../components/Footer'
import DeploymentHistory from '../components/DeploymentHistory'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState('')

  useEffect(() => {
    checkWalletConnection()
  }, [])

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setIsConnected(true)
          setAccount(accounts[0])
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        isConnected={isConnected} 
        account={account}
        onConnect={checkWalletConnection}
      />
      
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <img src="/logo-large.svg" alt="ShardMint Logo" className="h-20" />
        </div>
        
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        Mint tokens on Shardeum - Create and deploy your own ERC-20 token on Shardeum Unstablenet in minutes. 
        No coding required - just fill in the details and deploy!
      </p>
      </div>



        {/* Important Notice */}
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Important: Adding Tokens to MetaMask</h3>
              <p className="text-blue-800 text-sm">
                After deploying your token, it won't automatically appear in MetaMask. You'll need to add it manually using the contract address, or use our "Add to MetaMask" button after deployment.
              </p>
            </div>
          </div>
        </div>

        <TokenDeployer 
          isConnected={isConnected}
          account={account}
        />
        
        {isConnected && <DeploymentHistory />}
      </main>

      <Footer />
    </div>
  )
}
