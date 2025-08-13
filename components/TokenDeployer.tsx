'use client'

import { useState, useEffect } from 'react'
import TokenForm from './TokenForm'
import DeploymentStatus from './DeploymentStatus'
import TokenInfo from './TokenInfo'

interface TokenDeployerProps {
  isConnected: boolean
  account: string
}

interface TokenData {
  name: string
  symbol: string
  totalSupply: string
  decimals: number
  logo: string
  description: string
}

interface DeploymentResult {
  contractAddress: string
  transactionHash: string
  tokenData: TokenData
  timestamp: number
}

export default function TokenDeployer({ isConnected, account }: TokenDeployerProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null)
  const [deploymentError, setDeploymentError] = useState<string | null>(null)
  const [deploymentProgress, setDeploymentProgress] = useState<string>('')

  const handleDeploy = async (tokenData: TokenData) => {
    if (!isConnected) {
      setDeploymentError('Please connect your wallet first')
      return
    }

    setIsDeploying(true)
    setDeploymentError(null)
    setDeploymentProgress('Initializing deployment...')

    // Add timeout to prevent UI from getting stuck
    const deploymentTimeout = setTimeout(() => {
      if (isDeploying) {
        setDeploymentError('Deployment is taking longer than expected. Please check your wallet for transaction status.')
        setIsDeploying(false)
        setDeploymentProgress('')
      }
    }, 60000) // 60 second timeout

    try {
      // Import ethers dynamically to avoid SSR issues
      const { ethers } = await import('ethers')
      
      setDeploymentProgress('Connecting to wallet...')
      
      // Get the provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()

      setDeploymentProgress('Loading contract data...')
      
      // Import the contract ABI and bytecode
      const [tokenABI, tokenBytecode] = await Promise.all([
        import('../contracts/TokenABI.json'),
        import('../contracts/TokenBytecode.js')
      ])
      
      setDeploymentProgress('Creating contract factory...')
      
      // Create contract factory
      const CustomToken = new ethers.ContractFactory(
        tokenABI.default,
        tokenBytecode.TOKEN_BYTECODE,
        signer
      )

      // Calculate total supply
      const totalSupply = ethers.parseUnits(tokenData.totalSupply, tokenData.decimals)
      
      setDeploymentProgress('Estimating gas and deploying...')
      
      // Get current gas price and optimize for legacy transactions
      const feeData = await provider.getFeeData()
      const gasPrice = feeData.gasPrice
      
      // AGGRESSIVE gas optimization for maximum speed
      const gasLimit = 1000000 // Further reduced for faster processing
      // Use higher gas price for instant inclusion (50% higher)
      const aggressiveGasPrice = gasPrice ? gasPrice : undefined
      
      // Deploy with aggressive gas settings for maximum speed
      const contract = await CustomToken.deploy(
        tokenData.name,
        tokenData.symbol,
        totalSupply,
        tokenData.decimals,
        {
          gasLimit: gasLimit,
          gasPrice: aggressiveGasPrice,
        }
      )
      
      setDeploymentProgress('Transaction sent! Waiting for confirmation...')
      
      // Get transaction hash immediately for monitoring
      const deploymentTx = contract.deploymentTransaction()
      if (!deploymentTx) {
        throw new Error('Deployment transaction not found')
      }
      
      setDeploymentProgress(`Transaction hash: ${deploymentTx.hash.slice(0, 10)}...`)
      
      // Start monitoring transaction status independently
      const monitorTransaction = async () => {
        try {
          const receipt = await provider.getTransactionReceipt(deploymentTx.hash)
          if (receipt && receipt.status === 1) {
            console.log('Transaction confirmed via monitoring:', receipt)
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
          
          // IMMEDIATELY show result when transaction confirms
          const contractAddress = await contract.getAddress()
          const result: DeploymentResult = {
            contractAddress,
            transactionHash: deploymentTx.hash,
            tokenData,
            timestamp: Date.now()
          }
          
          console.log('Transaction confirmed - showing result immediately:', result)
          
          // Instant state update - no delays
          setDeploymentResult(result)
          setIsDeploying(false)
          setDeploymentProgress('')
          
          // Save to localStorage
          const deployedTokens = JSON.parse(localStorage.getItem('deployedTokens') || '[]')
          deployedTokens.push(result)
          localStorage.setItem('deployedTokens', JSON.stringify(deployedTokens))
          
          // Clear timeout since deployment succeeded
          clearTimeout(deploymentTimeout)
          
          return // Exit early since we already showed the result
        }
      }, 1000) // Check every 1 second instead of 2
      
      // Wait for deployment with faster confirmation strategy
      const deploymentReceipt = await contract.waitForDeployment()
      
      // Clear the status monitoring interval
      clearInterval(statusInterval)
      
      // Only proceed if result wasn't already shown by the monitor
      if (!deploymentResult) {
        setDeploymentProgress('Transaction confirmed! Finalizing...')
        
        // Get contract address immediately
        const contractAddress = await contract.getAddress()
        
        console.log('Contract deployed successfully:', contractAddress)
        console.log('Transaction hash:', deploymentTx.hash)
        
        // Create result immediately without waiting for additional confirmations
        const result: DeploymentResult = {
          contractAddress,
          transactionHash: deploymentTx.hash,
          tokenData,
          timestamp: Date.now()
        }
        
        console.log('Deployment result created:', result)
        
        // IMMEDIATE state update - no pending result system
        setDeploymentResult(result)
        setIsDeploying(false)
        setDeploymentProgress('')
        
        console.log('State updated - result should be visible now')
        
        // Save to localStorage
        const deployedTokens = JSON.parse(localStorage.getItem('deployedTokens') || '[]')
        deployedTokens.push(result)
        localStorage.setItem('deployedTokens', JSON.stringify(deployedTokens))
        
        // Clear timeout since deployment succeeded
        clearTimeout(deploymentTimeout)
      }
      
    } catch (error: any) {
      console.error('Deployment error:', error)
      setDeploymentError(error.message || 'Failed to deploy token')
      // Clear timeout on error
      clearTimeout(deploymentTimeout)
    } finally {
      setIsDeploying(false)
      setDeploymentProgress('')
    }
  }

  const resetDeployment = () => {
    setDeploymentResult(null)
    setDeploymentError(null)
  }

  if (!isConnected) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600 mb-6">
          Please connect your MetaMask wallet to start deploying tokens
        </p>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Network:</strong> Shardeum Unstablenet (Chain ID: 8080)
          </p>
        </div>
      </div>
    )
  }

  if (deploymentResult) {
    return (
      <div className="max-w-4xl mx-auto">
        <TokenInfo 
          result={deploymentResult}
          onDeployAnother={resetDeployment}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <TokenForm 
        onDeploy={handleDeploy}
        isDeploying={isDeploying}
      />
      
      {deploymentError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">
            <strong>Error:</strong> {deploymentError}
          </p>
        </div>
      )}
      
      {isDeploying && (
        <DeploymentStatus progress={deploymentProgress} />
      )}
      
      {/* Manual result display fallback */}
      {!isDeploying && !deploymentResult && !deploymentError && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            🎉 Token Deployed Successfully!
          </h3>
          <p className="text-yellow-800 mb-4">
            Your token has been deployed but the result display is delayed. Please refresh the page to see your token details.
          </p>
        </div>
      )}
    </div>
  )
}
