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
    <div className="min-h-screen flex flex-col" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header 
        isConnected={isConnected} 
        account={account}
        onConnect={checkWalletConnection}
      />
      
    <main className="flex-1 container mx-auto px-4 py-8" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div className="text-center mb-12" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="flex justify-center mb-6" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo-large.svg" alt="ShardMint Logo" className="h-20" style={{ height: '5rem' }} />
        </div>
        
      <p className="text-xl text-gray-600 max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: '#4b5563', maxWidth: '42rem', margin: '0 auto' }}>
        Mint tokens on Shardeum - Create and deploy your own ERC-20 token on Shardeum Unstablenet in minutes. 
        No coding required - just fill in the details and deploy!
      </p>
      </div>



        {/* Important Notice */}
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg" style={{ maxWidth: '42rem', margin: '0 auto 2rem auto', padding: '1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem' }}>
          <div className="flex items-start space-x-3" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div className="text-blue-600 text-xl" style={{ color: '#2563eb', fontSize: '1.25rem' }}>ℹ️</div>
            <div className="text-left" style={{ textAlign: 'left' }}>
              <h3 className="font-semibold text-blue-900 mb-2" style={{ fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>Important: Adding Tokens to MetaMask</h3>
              <p className="text-blue-800 text-sm" style={{ color: '#1e40af', fontSize: '0.875rem' }}>
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
