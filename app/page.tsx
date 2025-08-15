'use client'

import { useState, useEffect } from 'react'
import TokenDeployer from '../components/TokenDeployer'
import Header from '../components/Header'
import Footer from '../components/Footer'
import DeploymentHistory from '../components/DeploymentHistory'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState('')
  const [activeTab, setActiveTab] = useState<'deploy' | 'mint'>('deploy')
  const [deployedTokens, setDeployedTokens] = useState<any[]>([])
  const [selectedToken, setSelectedToken] = useState<any>(null)
  const [mintAmount, setMintAmount] = useState('')
  const [mintToAddress, setMintToAddress] = useState('')
  const [isMinting, setIsMinting] = useState(false)
  const [mintError, setMintError] = useState<string | null>(null)
  const [mintSuccess, setMintSuccess] = useState<string | null>(null)

  useEffect(() => {
    checkWalletConnection()
    loadDeployedTokens()
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

  const loadDeployedTokens = () => {
    try {
      const savedTokens = localStorage.getItem('deployedTokens')
      if (savedTokens) {
        const tokens = JSON.parse(savedTokens)
        setDeployedTokens(tokens)
        console.log('Loaded deployed tokens:', tokens)
      }
    } catch (error) {
      console.error('Error loading deployed tokens:', error)
    }
  }

  const handleMint = async () => {
    if (!selectedToken || !mintAmount || !mintToAddress) {
      setMintError('Please select a token and fill in both amount and recipient address')
      return
    }

    const amount = parseInt(mintAmount)
    if (amount <= 0) {
      setMintError('Amount must be greater than 0')
      return
    }

    // Calculate remaining mintable (simplified - you might want to fetch from blockchain)
    const currentSupply = parseInt(selectedToken.tokenData.initialSupply)
    const maxSupply = parseInt(selectedToken.tokenData.maxSupply)
    const remainingMintable = maxSupply - currentSupply

    if (amount > remainingMintable) {
      setMintError(`Cannot mint ${amount.toLocaleString()} tokens. Only ${remainingMintable.toLocaleString()} tokens can be minted.`)
      return
    }

    setIsMinting(true)
    setMintError(null)
    setMintSuccess(null)

    try {
      const { ethers } = await import('ethers')
      
      // Get the provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()

      // Create contract instance
      const contract = new ethers.Contract(
        selectedToken.contractAddress,
        [
          "function mint(address to, uint256 amount) external",
          "function totalSupply() external view returns (uint256)"
        ],
        signer
      )

      // Calculate the amount with proper decimals
      const mintAmountWei = selectedToken.tokenData.decimals === 18 
        ? ethers.parseEther(mintAmount)
        : ethers.parseUnits(mintAmount, selectedToken.tokenData.decimals)

      // Mint tokens
      const tx = await contract.mint(mintToAddress, mintAmountWei)
      
      // Show immediate success message
      setMintSuccess(`✅ Transaction sent! Minting ${amount.toLocaleString()} ${selectedToken.tokenData.symbol} to ${mintToAddress.slice(0, 6)}...${mintToAddress.slice(-4)}... Transaction: ${tx.hash.slice(0, 10)}...`)
      
      // Clear form immediately
      setMintAmount('')
      setMintToAddress('')
      
      // Stop loading immediately
      setIsMinting(false)
      
      // Start monitoring transaction status independently
      const monitorTransaction = async () => {
        try {
          const receipt = await provider.getTransactionReceipt(tx.hash)
          if (receipt && receipt.status === 1) {
            console.log('Mint transaction confirmed:', receipt)
            setMintSuccess(`✅ Successfully minted ${amount.toLocaleString()} ${selectedToken.tokenData.symbol} to ${mintToAddress.slice(0, 6)}...${mintToAddress.slice(-4)}! Transaction: ${tx.hash.slice(0, 10)}...`)
            
            // Reload tokens to show updated info
            loadDeployedTokens()
            return true
          }
          return false
        } catch (error) {
          return false
        }
      }
      
      // Check transaction status every 1 second for faster response
      const statusInterval = setInterval(async () => {
        const isConfirmed = await monitorTransaction()
        if (isConfirmed) {
          clearInterval(statusInterval)
        }
      }, 1000) // Check every 1 second
      
    } catch (error: any) {
      console.error('Minting error:', error)
      setMintError(error.message || 'Failed to mint tokens')
      setIsMinting(false)
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

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('deploy')}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
                activeTab === 'deploy'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🚀 Deploy New Token
            </button>
            <button
              onClick={() => setActiveTab('mint')}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
                activeTab === 'mint'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🪙 Mint More Tokens
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'deploy' && (
          <TokenDeployer 
            isConnected={isConnected}
            account={account}
          />
        )}

        {activeTab === 'mint' && (
          <div className="max-w-4xl mx-auto">
            {!isConnected ? (
              <div className="card text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-600 mb-6">
                  Please connect your MetaMask wallet to mint additional tokens
                </p>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Network:</strong> Shardeum Unstablenet (Chain ID: 8080)
                  </p>
                </div>
              </div>
            ) : deployedTokens.length === 0 ? (
              <div className="card text-center">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  No Tokens Deployed Yet
                </h2>
                <p className="text-gray-600 mb-6">
                  You haven't deployed any tokens yet. Switch to the "Deploy New Token" tab to create your first token.
                </p>
                <button
                  onClick={() => setActiveTab('deploy')}
                  className="btn-primary"
                >
                  🚀 Deploy Your First Token
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                                 <div className="card">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-semibold text-gray-900">Select Token to Mint</h3>
                     <button
                       onClick={loadDeployedTokens}
                       className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                     >
                       🔄 Refresh
                     </button>
                   </div>
                   <div className="grid gap-4">
                    {deployedTokens.map((token, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedToken(token)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedToken?.contractAddress === token.contractAddress
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-gray-900">{token.tokenData.name} ({token.tokenData.symbol})</h4>
                            <p className="text-sm text-gray-600">
                              Contract: {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Initial Supply: {parseInt(token.tokenData.initialSupply).toLocaleString()} | 
                              Max Supply: {parseInt(token.tokenData.maxSupply).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Decimals: {token.tokenData.decimals}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(token.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedToken && (
                  <div className="card">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Mint Additional {selectedToken.tokenData.symbol} Tokens
                    </h3>
                    
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Token Information</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                        <div>
                          <strong>Token:</strong> {selectedToken.tokenData.name} ({selectedToken.tokenData.symbol})
                        </div>
                        <div>
                          <strong>Contract:</strong> {selectedToken.contractAddress.slice(0, 6)}...{selectedToken.contractAddress.slice(-4)}
                        </div>
                        <div>
                          <strong>Initial Supply:</strong> {parseInt(selectedToken.tokenData.initialSupply).toLocaleString()} {selectedToken.tokenData.symbol}
                        </div>
                        <div>
                          <strong>Max Supply:</strong> {parseInt(selectedToken.tokenData.maxSupply).toLocaleString()} {selectedToken.tokenData.symbol}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="mintAmount" className="block text-sm font-medium text-gray-700 mb-2">
                          Amount to Mint *
                        </label>
                        <input
                          type="number"
                          id="mintAmount"
                          value={mintAmount}
                          onChange={(e) => setMintAmount(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter amount to mint"
                          min="1"
                          disabled={isMinting}
                        />
                      </div>

                      <div>
                        <label htmlFor="mintToAddress" className="block text-sm font-medium text-gray-700 mb-2">
                          Recipient Address *
                        </label>
                        <input
                          type="text"
                          id="mintToAddress"
                          value={mintToAddress}
                          onChange={(e) => setMintToAddress(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                          placeholder="0x..."
                          disabled={isMinting}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Address that will receive the minted tokens
                        </p>
                      </div>

                      {mintError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 text-sm">{mintError}</p>
                        </div>
                      )}

                      {mintSuccess && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-800 text-sm">{mintSuccess}</p>
                        </div>
                      )}

                      <button
                        onClick={handleMint}
                        disabled={isMinting || !mintAmount || !mintToAddress}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                      >
                        {isMinting ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Minting...
                          </span>
                        ) : (
                          `🪙 Mint ${mintAmount || '0'} ${selectedToken.tokenData.symbol}`
                        )}
                      </button>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes:</h4>
                      <ul className="text-yellow-800 space-y-1 text-sm">
                        <li>• Only you (the token owner) can mint additional tokens</li>
                        <li>• You cannot exceed the maximum supply</li>
                        <li>• Minted tokens will be sent directly to the specified recipient address</li>
                        <li>• Each mint operation requires a separate transaction and gas fees</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {isConnected && <DeploymentHistory />}
      </main>

      <Footer />
    </div>
  )
}
