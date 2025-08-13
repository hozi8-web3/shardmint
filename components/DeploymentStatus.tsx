'use client'

export default function DeploymentStatus() {
  return (
    <div className="card mt-6">
      <div className="text-center">
        <div className="animate-pulse-slow text-6xl mb-4">🚀</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Deploying Your Token
        </h3>
        <p className="text-gray-600 mb-6">
          Please wait while we deploy your token to the blockchain. 
          This may take a few minutes depending on network conditions.
        </p>
        
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-primary-600 font-medium">Processing transaction...</span>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
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
