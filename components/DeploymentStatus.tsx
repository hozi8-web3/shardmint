'use client'

import React, { useState, useEffect } from 'react'

interface DeploymentStatusProps {
  progress?: string
}

export default function DeploymentStatus({ progress }: DeploymentStatusProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="card mt-6">
      <div className="text-center">
        <div className="animate-pulse-slow text-6xl mb-4">🚀</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Deploying Your Token
        </h3>
        <p className="text-gray-600 mb-6">
          Please wait while we deploy your token to the blockchain. 
          This should take under 30 seconds with our aggressive optimizations.
        </p>
        
        {progress && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 font-medium">{progress}</p>
            {progress.includes('Transaction hash:') && (
              <p className="text-xs text-blue-600 mt-2">
                💡 You can monitor this transaction on the Shardeum Explorer
              </p>
            )}
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((elapsedTime / 30) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Elapsed time: {formatTime(elapsedTime)} | Target: 30 seconds
          </p>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-primary-600 font-medium">Processing transaction...</span>
        </div>
        
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>🚀 Aggressive Speed Optimization:</strong> Using 50% higher gas price and reduced gas limit for instant deployment on Shardeum
          </p>
          <p className="text-sm text-green-800 mt-2">
            <strong>🔧 Accurate Decimal Handling:</strong> Using ethers.parseUnits() to ensure your wallet displays exactly the token amount you specified
          </p>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Do not close this page or disconnect your wallet until the deployment is complete.
          </p>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>You can monitor the transaction on the Shardeum Explorer</p>
        </div>
      </div>
    </div>
  )
}
