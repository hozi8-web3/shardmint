'use client'

import React, { useEffect, useState } from 'react'

interface TokenInfoProps {
  result: {
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
      totalSupply: string
    }
  }
  onDeployAnother: () => void
}

export default function TokenInfo({ result, onDeployAnother }: TokenInfoProps) {
  const { contractAddress, transactionHash, tokenData } = result
  const [activeTab, setActiveTab] = useState<'info' | 'mint'>('info')
  const [mintAmount, setMintAmount] = useState('')
  const [mintToAddress, setMintToAddress] = useState('')
  const [isMinting, setIsMinting] = useState(false)
  const [mintError, setMintError] = useState<string | null>(null)
  const [mintSuccess, setMintSuccess] = useState<string | null>(null)
  const [currentTotalSupply, setCurrentTotalSupply] = useState<string>(tokenData.initialSupply)
  

  
  // Store deployment result in localStorage for persistence
  useEffect(() => {
    localStorage.setItem('lastDeploymentResult', JSON.stringify(result))
  }, [result])

  // Fetch current total supply from blockchain
  useEffect(() => {
    const fetchTotalSupply = async () => {
      try {
        const { ethers } = await import('ethers')
        const provider = new ethers.BrowserProvider(window.ethereum as any)
        
        const contract = new ethers.Contract(
          contractAddress,
          ["function totalSupply() external view returns (uint256)"],
          provider
        )
        
        const totalSupply = await contract.totalSupply()
        const totalSupplyFormatted = tokenData.decimals === 18 
          ? ethers.formatEther(totalSupply)
          : ethers.formatUnits(totalSupply, tokenData.decimals)
        
        setCurrentTotalSupply(totalSupplyFormatted)
      } catch (error) {
        console.error('Error fetching total supply:', error)
        // Keep the initial supply if we can't fetch from blockchain
      }
    }

    if (contractAddress) {
      fetchTotalSupply()
    }
  }, [contractAddress, tokenData.decimals])

  // Calculate remaining mintable amount
  const remainingMintable = parseInt(tokenData.maxSupply) - parseInt(currentTotalSupply)
  const canMint = remainingMintable > 0
  
  const explorerUrl = `https://explorer-unstable.shardeum.org/address/${contractAddress}`
  const txUrl = `https://explorer-unstable.shardeum.org/tx/${transactionHash}`

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
    alert(`${type} copied to clipboard!`)
  }

  const handleMint = async () => {
    if (!mintAmount || !mintToAddress) {
      setMintError('Please fill in both amount and recipient address')
      return
    }

    const amount = parseInt(mintAmount)
    if (amount <= 0) {
      setMintError('Amount must be greater than 0')
      return
    }

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
        contractAddress,
        [
          "function mint(address to, uint256 amount) external",
          "function totalSupply() external view returns (uint256)"
        ],
        signer
      )

      // Calculate the amount with proper decimals
      const mintAmountWei = tokenData.decimals === 18 
        ? ethers.parseEther(mintAmount)
        : ethers.parseUnits(mintAmount, tokenData.decimals)

      // Mint tokens
      const tx = await contract.mint(mintToAddress, mintAmountWei)
      
      setMintSuccess(`Minting ${amount.toLocaleString()} ${tokenData.symbol} to ${mintToAddress.slice(0, 6)}...${mintToAddress.slice(-4)}...`)
      
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      
      if (receipt.status === 1) {
        // Update total supply
        const newTotalSupply = await contract.totalSupply()
        const newTotalSupplyFormatted = tokenData.decimals === 18 
          ? ethers.formatEther(newTotalSupply)
          : ethers.formatUnits(newTotalSupply, tokenData.decimals)
        
        setCurrentTotalSupply(newTotalSupplyFormatted)
        setMintSuccess(`✅ Successfully minted ${amount.toLocaleString()} ${tokenData.symbol} to ${mintToAddress.slice(0, 6)}...${mintToAddress.slice(-4)}! Transaction: ${tx.hash.slice(0, 10)}...`)
        
        // Clear form
        setMintAmount('')
        setMintToAddress('')
      }
    } catch (error: any) {
      console.error('Minting error:', error)
      setMintError(error.message || 'Failed to mint tokens')
    } finally {
      setIsMinting(false)
    }
  }

  const addTokenToMetaMask = async (address: string, symbol: string, decimals: number) => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        console.log('Adding token to MetaMask:', { address, symbol, decimals })
        
        // Validate parameters
        if (!address || !symbol || decimals === undefined) {
          throw new Error('Invalid token parameters')
        }
        
        // Check if user is on the correct network (Shardeum Unstablenet)
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        if (chainId !== '0x1f90') { // 8080 in hex
          // Try to switch to the correct network first
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x1f90' }]
            })
            console.log('Successfully switched to Shardeum Unstablenet')
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              // Chain not added, try to add it
              try {
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
                console.log('Successfully added Shardeum Unstablenet')
              } catch (addError: any) {
                console.error('Failed to add network:', addError)
                alert('⚠️ Please manually switch to Shardeum Unstablenet (Chain ID: 8080) before adding the token to MetaMask.')
                return
              }
            } else {
              console.error('Failed to switch network:', switchError)
              alert('⚠️ Please manually switch to Shardeum Unstablenet (Chain ID: 8080) before adding the token to MetaMask.')
              return
            }
          }
        }
        
        // Ensure address is checksummed
        const { ethers } = await import('ethers')
        const checksummedAddress = ethers.getAddress(address)
        
        // Use the correct MetaMask API format
        try {
          const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: checksummedAddress,
                symbol: symbol.toUpperCase(),
                decimals: parseInt(decimals.toString()),
                image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
              },
            } as any, // Type assertion to bypass TypeScript error
          })
          
          if (wasAdded) {
            console.log('Token added successfully!')
            alert('✅ Token added to MetaMask successfully! Check your wallet.')
            
            // Also try to refresh the page to trigger MetaMask to show the token
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          } else {
            console.log('Token was not added')
            alert('⚠️ Token was not added to MetaMask. Please try again or add manually.')
          }
          
        } catch (watchAssetError: any) {
          console.error('wallet_watchAsset failed:', watchAssetError)
          
          // Try the legacy method as fallback
          try {
            const legacyResult = await window.ethereum.request({
              method: 'wallet_addEthereumToken',
              params: [{
                type: 'ERC20',
                options: {
                  address: checksummedAddress,
                  symbol: symbol.toUpperCase(),
                  decimals: parseInt(decimals.toString())
                }
              }]
            })
            
            console.log('Legacy method response:', legacyResult)
            alert('✅ Token added to MetaMask successfully using legacy method! Check your wallet.')
            
            setTimeout(() => {
              window.location.reload()
            }, 2000)
            
          } catch (legacyError: any) {
            console.error('All methods failed:', { watchAssetError, legacyError })
            throw new Error('All MetaMask token addition methods failed')
          }
        }
        
      } catch (error: any) {
        console.error('Error adding token to MetaMask:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack,
          data: error.data
        })
        
        // Provide specific error messages and solutions
        let errorMessage = 'Failed to add token to MetaMask.\n\n'
        
        if (error.code === 4001) {
          errorMessage += '❌ User rejected the request.\n\n'
        } else if (error.code === -32602) {
          errorMessage += '❌ Invalid parameters.\n\n'
        } else if (error.message) {
          errorMessage += `❌ Error: ${error.message}\n\n`
        } else {
          errorMessage += '❌ Unknown error occurred.\n\n'
        }
        
        errorMessage += '📋 Please add it manually:\n'
        errorMessage += '1. Open MetaMask\n'
        errorMessage += '2. Click "Import tokens"\n'
        errorMessage += '3. Paste this address: ' + address + '\n'
        errorMessage += '4. Click "Add Custom Token"\n'
        errorMessage += '5. Verify symbol: ' + symbol + ' and decimals: ' + decimals + '\n'
        errorMessage += '6. Click "Import Tokens"\n\n'
        errorMessage += '🔍 Debug Info:\n'
        errorMessage += 'Address: ' + address + '\n'
        errorMessage += 'Symbol: ' + symbol + '\n'
        errorMessage += 'Decimals: ' + decimals + '\n'
        errorMessage += 'Network: Shardeum Unstablenet (Chain ID: 8080)'
        
        alert(errorMessage)
      }
    } else {
      alert('❌ MetaMask not detected. Please install MetaMask to use this feature.')
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

      {/* Tab Navigation */}
      <div className="card">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'info'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Token Info
          </button>
          <button
            onClick={() => setActiveTab('mint')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'mint'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🪙 Mint Tokens
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <>
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
                <label className="block text-sm font-medium text-gray-500">Current Total Supply</label>
                <p className="text-lg font-semibold text-gray-900">
                  {parseInt(currentTotalSupply).toLocaleString()} {tokenData.symbol}
                </p>
                <p className="text-xs text-gray-500">
                  (Initial: {parseInt(tokenData.initialSupply).toLocaleString()} + Minted: {(parseInt(currentTotalSupply) - parseInt(tokenData.initialSupply)).toLocaleString()})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Max Supply</label>
                <p className="text-lg font-semibold text-gray-900">
                  {parseInt(tokenData.maxSupply).toLocaleString()} {tokenData.symbol}
                </p>
                <p className="text-xs text-gray-500">
                  (Maximum tokens that can ever exist)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Remaining Mintable</label>
                <p className={`text-lg font-semibold ${canMint ? 'text-green-600' : 'text-red-600'}`}>
                  {remainingMintable.toLocaleString()} {tokenData.symbol}
                </p>
                <p className="text-xs text-gray-500">
                  {canMint ? '(You can mint more tokens)' : '(Max supply reached)'}
                </p>
              </div>
              {tokenData.logo && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Logo URL</label>
                  <p className="text-sm text-gray-900 break-all">{tokenData.logo}</p>
                </div>
              )}
              {tokenData.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900">{tokenData.description}</p>
                </div>
              )}
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
                 💡 💡 <strong>Pro Tip:</strong> After adding the token to MetaMask, you should see {parseInt(tokenData.initialSupply).toLocaleString()} {tokenData.symbol} in your wallet balance!
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
              <li>• Mint additional tokens if needed</li>
            </ul>
          </div>
        </>
      )}

      {/* Mint Tab */}
      {activeTab === 'mint' && (
        <div className="card">

          <h3 className="text-xl font-semibold text-gray-900 mb-4">Mint Additional Tokens</h3>
          
          {!canMint ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-center">
                🚫 <strong>Max Supply Reached!</strong> This token has reached its maximum supply of {parseInt(tokenData.maxSupply).toLocaleString()} {tokenData.symbol}.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Minting Information</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <strong>Current Total Supply:</strong> {parseInt(currentTotalSupply).toLocaleString()} {tokenData.symbol}
                  </div>
                  <div>
                    <strong>Max Supply:</strong> {parseInt(tokenData.maxSupply).toLocaleString()} {tokenData.symbol}
                  </div>
                  <div>
                    <strong>Remaining Mintable:</strong> {remainingMintable.toLocaleString()} {tokenData.symbol}
                  </div>
                  <div>
                    <strong>Your Role:</strong> Token Owner (can mint up to max supply)
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
                    placeholder={`Max: ${remainingMintable.toLocaleString()}`}
                    min="1"
                    max={remainingMintable}
                    disabled={isMinting}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Maximum you can mint: {remainingMintable.toLocaleString()} {tokenData.symbol}
                  </p>
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
                  disabled={isMinting || !mintAmount || !mintToAddress || parseInt(mintAmount) > remainingMintable}
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
                    `🪙 Mint ${mintAmount || '0'} ${tokenData.symbol}`
                  )}
                </button>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes:</h4>
                <ul className="text-yellow-800 space-y-1 text-sm">
                  <li>• Only you (the token owner) can mint additional tokens</li>
                  <li>• You cannot exceed the maximum supply of {parseInt(tokenData.maxSupply).toLocaleString()} {tokenData.symbol}</li>
                  <li>• Minted tokens will be sent directly to the specified recipient address</li>
                  <li>• Each mint operation requires a separate transaction and gas fees</li>
                  <li>• The recipient will immediately see the new tokens in their wallet</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
