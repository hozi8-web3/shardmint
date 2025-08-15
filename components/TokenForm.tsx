'use client'

import { useState } from 'react'

interface TokenFormProps {
  onDeploy: (tokenData: {
    name: string
    symbol: string
    initialSupply: string
    maxSupply: string
    decimals: number
    logo: string
    description: string
  }) => void
  isDeploying: boolean
}

export default function TokenForm({ onDeploy, isDeploying }: TokenFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    initialSupply: '1000000',
    maxSupply: '10000000',
    decimals: 18,
    logo: '',
    description: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Token name is required'
    } else if (formData.name.length > 50) {
      newErrors.name = 'Token name must be less than 50 characters'
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Token symbol is required'
    } else if (formData.symbol.length > 10) {
      newErrors.symbol = 'Token symbol must be less than 10 characters'
    }

    if (!formData.initialSupply || parseFloat(formData.initialSupply) <= 0) {
      newErrors.initialSupply = 'Initial supply must be greater than 0'
    }

    if (!formData.maxSupply || parseFloat(formData.maxSupply) <= 0) {
      newErrors.maxSupply = 'Max supply must be greater than 0'
    }

    if (parseFloat(formData.maxSupply) < parseFloat(formData.initialSupply)) {
      newErrors.maxSupply = 'Max supply must be greater than or equal to initial supply'
    }

    if (formData.decimals < 0 || formData.decimals > 18) {
      newErrors.decimals = 'Decimals must be between 0 and 18'
    }

    if (formData.logo && !isValidUrl(formData.logo)) {
      newErrors.logo = 'Please enter a valid URL for the logo'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onDeploy(formData)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Create Your Token
        </h2>
        <p className="text-gray-600">
          Fill in the details below to deploy your custom ERC-20 token
        </p>
      </div>

      {/* Contract Information */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 text-xl">ℹ️</div>
          <div className="text-left">
            <h3 className="font-semibold text-blue-900 mb-2">Contract Features</h3>
            <p className="text-blue-800 text-sm mb-2">
              <strong>✅ ERC20Capped:</strong> Your token will have a maximum supply limit that cannot be exceeded.
            </p>
            <p className="text-blue-800 text-sm mb-2">
              <strong>✅ Ownable:</strong> Only you (the deployer) can mint additional tokens up to the max supply.
            </p>
            <p className="text-blue-800 text-sm">
              <strong>✅ Custom Metadata:</strong> Includes logo URL and description stored on-chain.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Token Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.name ? 'border-red-500' : ''}`}
            placeholder="e.g., My Awesome Token"
            disabled={isDeploying}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            This will be the full name of your token (e.g., "Ethereum", "Chainlink")
          </p>
        </div>

        <div>
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-2">
            Token Symbol *
          </label>
          <input
            type="text"
            id="symbol"
            value={formData.symbol}
            onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.symbol ? 'border-red-500' : ''}`}
            placeholder="e.g., MAT"
            disabled={isDeploying}
          />
          {errors.symbol && (
            <p className="mt-1 text-sm text-red-600">{errors.symbol}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Short ticker symbol for your token (e.g., "ETH", "LINK", "UNI")
          </p>
        </div>

        <div>
          <label htmlFor="decimals" className="block text-sm font-medium text-gray-700 mb-2">
            Decimals *
          </label>
          <select
            id="decimals"
            value={formData.decimals}
            onChange={(e) => handleInputChange('decimals', parseInt(e.target.value))}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.decimals ? 'border-red-500' : ''}`}
            disabled={isDeploying}
          >
            <option value={0}>0 (Whole numbers only)</option>
            <option value={6}>6 (e.g., USDC)</option>
            <option value={8}>8 (e.g., Bitcoin)</option>
            <option value={18}>18 (e.g., ETH, most ERC-20 tokens)</option>
          </select>
          {errors.decimals && (
            <p className="mt-1 text-sm text-red-600">{errors.decimals}</p>
          )}
          
          {/* Decimals Explanation */}
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 mb-2">
              <strong>How decimals work:</strong>
            </p>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• <strong>18 decimals:</strong> Standard for most ERC-20 tokens (supports fractional amounts like 1.5 tokens)</li>
              <li>• <strong>6 decimals:</strong> Common for stablecoins (supports amounts like 1.000001)</li>
              <li>• <strong>0 decimals:</strong> Whole numbers only (1, 2, 3... no fractions)</li>
            </ul>
          </div>
        </div>

        <div>
          <label htmlFor="initialSupply" className="block text-sm font-medium text-gray-700 mb-2">
            Initial Supply *
          </label>
          <input
            type="number"
            id="initialSupply"
            value={formData.initialSupply}
            onChange={(e) => handleInputChange('initialSupply', e.target.value)}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.initialSupply ? 'border-red-500' : ''}`}
            placeholder="1000000"
            min="1"
            step="1"
            disabled={isDeploying}
          />
          {errors.initialSupply && (
            <p className="mt-1 text-sm text-red-600">{errors.initialSupply}</p>
          )}

          {/* Initial Supply Calculator */}
          <div className="mt-2 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 mb-2">
              <strong>Initial tokens minted to your wallet:</strong>
            </p>
            <div className="text-sm font-mono bg-white p-2 rounded border">
              {formData.initialSupply && parseFloat(formData.initialSupply) > 0 ? (
                <>
                  <div className="text-green-600">
                    {parseFloat(formData.initialSupply).toLocaleString()} tokens
                  </div>
                  <div className="text-blue-600 text-xs mt-1">
                    💡 These tokens will be minted to your address when the contract is deployed
                  </div>
                </>
              ) : (
                <span className="text-gray-400">Enter an initial supply to see calculation</span>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="maxSupply" className="block text-sm font-medium text-gray-700 mb-2">
            Max Supply *
          </label>
          <input
            type="number"
            id="maxSupply"
            value={formData.maxSupply}
            onChange={(e) => handleInputChange('maxSupply', e.target.value)}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.maxSupply ? 'border-red-500' : ''}`}
            placeholder="10000000"
            min={formData.initialSupply ? Number(formData.initialSupply) : 1}
            step="1"
            disabled={isDeploying}
          />
          {errors.maxSupply && (
            <p className="mt-1 text-sm text-red-600">{errors.maxSupply}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Maximum total supply that can ever exist. You can mint additional tokens up to this limit using the mint() function.
          </p>
        </div>

        <div>
          <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
            Token Logo URL
          </label>
          <input
            type="url"
            id="logo"
            value={formData.logo}
            onChange={(e) => handleInputChange('logo', e.target.value)}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.logo ? 'border-red-500' : ''}`}
            placeholder="https://example.com/logo.png"
            disabled={isDeploying}
          />
          {errors.logo && (
            <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Optional: Direct link to your token's logo image (PNG, JPG, SVG). This will be stored on-chain via the logoUrl() function.
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Token Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.description ? 'border-red-500' : ''}`}
            placeholder="Describe your token's purpose, utility, or vision..."
            rows={3}
            disabled={isDeploying}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Optional: Help users understand what your token is for. This will be stored on-chain via the description() function.
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={isDeploying}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isDeploying ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deploying Token...
              </span>
            ) : (
              '🚀 Deploy Token'
            )}
          </button>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• You'll need SHM tokens for gas fees - get them from the <a href="https://docs.shardeum.org/docs/developer/faucet" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-900">Shardeum Faucet</a></li>
            <li>• You'll be the owner and can mint additional tokens up to the max supply</li>
            <li>• The contract uses ERC20Capped to enforce the maximum supply limit</li>
            <li>• Logo URL and description are stored on-chain and publicly readable</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
