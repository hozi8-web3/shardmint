'use client'

import { useState, useEffect } from 'react'

interface DeployedToken {
  contractAddress: string
  transactionHash: string
  tokenData: {
    name: string
    symbol: string
    initialSupply: string
    maxSupply: string
    decimals: number
    logo: string
    description: string
  }
  timestamp?: number
}

interface DeploymentHistoryProps {
  account?: string
}

export default function DeploymentHistory({ account }: DeploymentHistoryProps) {
  const [deployedTokens, setDeployedTokens] = useState<DeployedToken[]>([])

  useEffect(() => {
    if (account) {
      loadDeployedTokens()
    }
  }, [account])

  const loadDeployedTokens = async () => {
    if (!account) return
    
    try {
      // Load from localStorage as primary source
      const savedTokens = localStorage.getItem('deployedTokens')
      if (savedTokens) {
        const tokens = JSON.parse(savedTokens)
        setDeployedTokens(tokens)
      }
    } catch (error) {
      console.error('Error loading tokens:', error)
    }
  }

  const clearHistory = () => {
    localStorage.removeItem('deployedTokens')
    setDeployedTokens([])
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log(`${type} copied to clipboard`)
    }).catch(err => {
      console.error('Failed to copy: ', err)
    })
  }

  if (deployedTokens.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-12">
        <div className="card text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Deployments Yet
          </h2>
          <p className="text-gray-600 mb-6">
            You haven't deployed any tokens yet. Deploy your first token to see it here!
          </p>
          <div className="text-sm text-gray-500">
            Note: This section shows tokens from your local deployment history. 
            Use the "Mint More Tokens" tab to scan blockchain or import tokens manually.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto mt-12">
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Deployment History
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={loadDeployedTokens}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              onClick={clearHistory}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {deployedTokens.map((token, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {token.tokenData.name} ({token.tokenData.symbol})
                  </h3>
                  <p className="text-sm text-gray-600">
                    Deployed on {token.timestamp ? new Date(token.timestamp).toLocaleDateString() : 'Unknown date'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    Decimals: {token.tokenData.decimals}
                  </div>
                  <div className="text-xs text-gray-400">
                    {token.tokenData.initialSupply} / {token.tokenData.maxSupply} supply
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Contract Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(token.contractAddress, 'Contract address')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Transaction Hash
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {token.transactionHash !== 'N/A' ? `${token.transactionHash.slice(0, 6)}...${token.transactionHash.slice(-4)}` : 'N/A'}
                    </code>
                    {token.transactionHash !== 'N/A' && (
                      <button
                        onClick={() => copyToClipboard(token.transactionHash, 'Transaction hash')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        📋
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {token.tokenData.logo && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Logo URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded truncate flex-1">
                      {token.tokenData.logo}
                    </code>
                    <button
                      onClick={() => copyToClipboard(token.tokenData.logo, 'Logo URL')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}

              {token.tokenData.description && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Description
                  </label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {token.tokenData.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
