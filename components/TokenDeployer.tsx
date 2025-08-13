'use client'

import { useState } from 'react'
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

  const handleDeploy = async (tokenData: TokenData) => {
    if (!isConnected) {
      setDeploymentError('Please connect your wallet first')
      return
    }

    setIsDeploying(true)
    setDeploymentError(null)

    try {
      // Import ethers dynamically to avoid SSR issues
      const { ethers } = await import('ethers')
      
      // Get the provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()

      // Import the contract ABI
      const tokenABI = await import('../contracts/TokenABI.json')
      
      // Import the contract bytecode
      const tokenBytecode = await import('../contracts/TokenBytecode.js')
      
      // Create contract factory
      const CustomToken = new ethers.ContractFactory(
        tokenABI.default,
        tokenBytecode.TOKEN_BYTECODE,
        signer
      )

      // Deploy the contract
      const totalSupply = ethers.parseUnits(tokenData.totalSupply, tokenData.decimals)
      
      const contract = await CustomToken.deploy(
        tokenData.name,
        tokenData.symbol,
        totalSupply,
        tokenData.decimals
      )

      // Wait for deployment
      await contract.waitForDeployment()
      
      const contractAddress = await contract.getAddress()
      const deploymentTx = contract.deploymentTransaction()
      
      if (deploymentTx) {
        const result: DeploymentResult = {
          contractAddress,
          transactionHash: deploymentTx.hash,
          tokenData,
          timestamp: Date.now()
        }
        
        setDeploymentResult(result)
        
        // Save to localStorage
        const deployedTokens = JSON.parse(localStorage.getItem('deployedTokens') || '[]')
        deployedTokens.push(result)
        localStorage.setItem('deployedTokens', JSON.stringify(deployedTokens))
      }
    } catch (error: any) {
      console.error('Deployment error:', error)
      setDeploymentError(error.message || 'Failed to deploy token')
    } finally {
      setIsDeploying(false)
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
        <DeploymentStatus />
      )}
    </div>
  )
}
