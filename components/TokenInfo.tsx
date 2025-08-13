'use client'

interface TokenInfoProps {
  result: {
    contractAddress: string
    transactionHash: string
    tokenData: {
      name: string
      symbol: string
      totalSupply: string
      decimals: number
    }
  }
  onDeployAnother: () => void
}

export default function TokenInfo({ result, onDeployAnother }: TokenInfoProps) {
  const { contractAddress, transactionHash, tokenData } = result
  
  const explorerUrl = `https://explorer-unstable.shardeum.org/address/${contractAddress}`
  const txUrl = `https://explorer-unstable.shardeum.org/tx/${transactionHash}`

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
    alert(`${type} copied to clipboard!`)
  }

  const addTokenToMetaMask = async (address: string, symbol: string, decimals: number) => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: [{
            type: 'ERC20',
            options: {
              address: address,
              symbol: symbol,
              decimals: decimals,
              image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' // Generic token icon
            }
          }]
        })
        alert('Token added to MetaMask successfully! Check your wallet.')
      } catch (error) {
        console.error('Error adding token to MetaMask:', error)
        alert('Failed to add token to MetaMask. Please add it manually using the contract address.')
      }
    } else {
      alert('MetaMask not detected. Please install MetaMask to use this feature.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="card text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Token Deployed Successfully!
        </h2>
        <p className="text-gray-600">
          Your ERC-20 token has been deployed to the Shardeum Unstablenet
        </p>
      </div>

      {/* Token Details */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Token Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Token Name</label>
            <p className="text-lg font-semibold text-gray-900">{tokenData.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Token Symbol</label>
            <p className="text-lg font-semibold text-gray-900">{tokenData.symbol}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Total Supply</label>
            <p className="text-lg font-semibold text-gray-900">
              {parseInt(tokenData.totalSupply).toLocaleString()} {tokenData.symbol}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Decimals</label>
            <p className="text-lg font-semibold text-gray-900">{tokenData.decimals}</p>
          </div>
        </div>
      </div>

      {/* Contract Information */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Contract Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Contract Address</label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                {contractAddress}
              </code>
              <button
                onClick={() => copyToClipboard(contractAddress, 'Contract address')}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Transaction Hash</label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                {transactionHash}
              </code>
              <button
                onClick={() => copyToClipboard(transactionHash, 'Transaction hash')}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => addTokenToMetaMask(contractAddress, tokenData.symbol, tokenData.decimals)}
            className="btn-primary text-center"
          >
            🪙 Add to MetaMask
          </button>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-center"
          >
            🔍 View on Explorer
          </a>
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-center"
          >
            📊 View Transaction
          </a>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onDeployAnother}
            className="w-full btn-primary"
          >
            🚀 Deploy Another Token
          </button>
        </div>
      </div>

      {/* Token Visibility Info */}
      <div className="card bg-yellow-50 border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ Token Not Showing in Wallet?</h3>
        <p className="text-yellow-800 text-sm mb-3">
          Custom ERC-20 tokens don't automatically appear in MetaMask. You need to add them manually:
        </p>
        <ul className="text-yellow-800 space-y-2 text-sm">
          <li>• <strong>Click "Add to MetaMask" above</strong> to automatically add the token</li>
          <li>• <strong>Or manually:</strong> In MetaMask → Import tokens → Paste contract address</li>
          <li>• <strong>Contract Address:</strong> {contractAddress}</li>
          <li>• <strong>Token Symbol:</strong> {tokenData.symbol}</li>
          <li>• <strong>Decimals:</strong> {tokenData.decimals}</li>
        </ul>
        <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
          <p className="text-yellow-900 text-sm font-medium">
            💡 <strong>Pro Tip:</strong> After adding the token to MetaMask, you should see {parseInt(tokenData.totalSupply).toLocaleString()} {tokenData.symbol} in your wallet balance!
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">What's Next?</h3>
        <ul className="text-blue-800 space-y-2 text-sm">
          <li>• Your tokens are now minted to your wallet address</li>
          <li>• You can transfer tokens to other addresses</li>
          <li>• Add your token to DEXs like ShardeumSwap (when available)</li>
          <li>• Use your token in DeFi applications</li>
        </ul>
      </div>
    </div>
  )
}
