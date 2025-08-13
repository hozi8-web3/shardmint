'use client'

import { useState, useEffect } from 'react'

interface DeployedToken {
  contractAddress: string
  transactionHash: string
  tokenData: {
    name: string
    symbol: string
    totalSupply: string
    decimals: number
  }
  timestamp?: number
}

export default function DeploymentHistory() {
  const [deployedTokens, setDeployedTokens] = useState<DeployedToken[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    loadDeployedTokens()
  }, [])

  const loadDeployedTokens = () => {
    try {
      const stored = localStorage.getItem('deployedTokens')
      if (stored) {
        const tokens = JSON.parse(stored)
        setDeployedTokens(tokens)
      }
    } catch (error) {
      console.error('Error loading deployed tokens:', error)
    }
  }

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all deployment history?')) {
      localStorage.removeItem('deployedTokens')
      setDeployedTokens([])
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    alert(`${type} copied to clipboard!`)
  }

  if (deployedTokens.length === 0) {
    return null
  }

  return (
    <div className="card mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          📚 Deployment History ({deployedTokens.length})
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm transition-colors"
          >
            {isVisible ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={clearHistory}
            className="px-3 py-1 bg-red-200 hover:bg-red-300 rounded text-sm transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {isVisible && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {deployedTokens.map((token, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">
                  {token.tokenData.name} ({token.tokenData.symbol})
                </h4>
                <span className="text-xs text-gray-500">
                  {token.timestamp ? new Date(token.timestamp).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Supply:</span>{' '}
                  {parseInt(token.tokenData.totalSupply).toLocaleString()} {token.tokenData.symbol}
                </div>
                <div>
                  <span className="text-gray-500">Decimals:</span> {token.tokenData.decimals}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Contract:</span>
                  <code className="flex-1 text-xs bg-gray-100 p-1 rounded break-all">
                    {token.contractAddress}
                  </code>
                  <button
                    onClick={() => copyToClipboard(token.contractAddress, 'Contract address')}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                  >
                    📋
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Tx Hash:</span>
                  <code className="flex-1 text-xs bg-gray-100 p-1 rounded break-all">
                    {token.transactionHash}
                  </code>
                  <button
                    onClick={() => copyToClipboard(token.transactionHash, 'Transaction hash')}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="mt-3 flex space-x-2">
                <a
                  href={`https://explorer-unstable.shardeum.org/address/${token.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs transition-colors"
                >
                  🔍 View Contract
                </a>
                <a
                  href={`https://explorer-unstable.shardeum.org/tx/${token.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-xs transition-colors"
                >
                  📊 View Transaction
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
