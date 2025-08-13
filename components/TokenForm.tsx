'use client'

import { useState } from 'react'

interface TokenFormProps {
  onDeploy: (tokenData: {
    name: string
    symbol: string
    totalSupply: string
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
    totalSupply: '1000000',
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

    if (!formData.totalSupply || parseFloat(formData.totalSupply) <= 0) {
      newErrors.totalSupply = 'Total supply must be greater than 0'
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

  // Calculate the wei units for display
  const calculateWeiUnits = () => {
    const supplyString = formData.totalSupply;
    const decimals = formData.decimals;

    try {
      if (!supplyString || parseFloat(supplyString) <= 0 || isNaN(parseFloat(supplyString))) {
        return "0";
      }

      // Convert the string total supply to BigInt directly to avoid floating point issues.
      // Assuming totalSupply is always an integer string due to input type="number" and step="1".
      let rawWei = BigInt(supplyString); 
      const multiplier = BigInt(Math.pow(10, decimals));
      rawWei = rawWei * multiplier;
      
      return rawWei.toString();
    } catch (e) {
      console.error("Error calculating wei units with BigInt:", e);
      // Fallback in case BigInt conversion fails (e.g., if supplyString somehow contains decimals)
      const supply = parseFloat(supplyString);
      // Use BigInt conversion on the floored value for safety in fallback as well
      return (BigInt(Math.floor(supply)) * BigInt(Math.pow(10, decimals))).toString();
    }
  };

  const weiUnits = calculateWeiUnits();


  return (
    <div className="card">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Create Your Token
        </h2>
        <p className="text-gray-600">
          Fill in the details below to deploy your custom ERC-20 token
        </p>
      </div>

      {/* Decimals Warning */}
      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="text-orange-600 text-xl">💡</div>
          <div className="text-left">
            <h3 className="font-semibold text-orange-900 mb-2">Understanding Token Decimals</h3>
            <p className="text-orange-800 text-sm mb-2">
              <strong>Important:</strong> The total supply you enter will be multiplied by $10^{formData.decimals}$ internally to get the raw value (wei units). 
              This raw value is what's stored on the blockchain.
            </p>
            <p className="text-orange-800 text-sm">
              <strong>💡 Tip:</strong> Use the calculator below to see exactly how many wei units will be minted and how your wallet will display it.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Token Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`input-field ${errors.name ? 'border-red-500' : ''}`}
            placeholder="e.g., My Awesome Token"
            disabled={isDeploying}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
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
            className={`input-field ${errors.symbol ? 'border-red-500' : ''}`}
            placeholder="e.g., MAT"
            disabled={isDeploying}
          />
          {errors.symbol && (
            <p className="mt-1 text-sm text-red-600">{errors.symbol}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Token Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`input-field ${errors.description ? 'border-red-500' : ''}`}
            placeholder="Describe your token's purpose, utility, or vision..."
            rows={3}
            disabled={isDeploying}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Optional: Help users understand what your token is for
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
            className={`input-field ${errors.logo ? 'border-red-500' : ''}`}
            placeholder="https://example.com/logo.png"
            disabled={isDeploying}
          />
          {errors.logo && (
            <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Optional: Direct link to your token's logo image (PNG, JPG, SVG)
          </p>
        </div>

        <div>
          <label htmlFor="totalSupply" className="block text-sm font-medium text-gray-700 mb-2">
            Total Supply *
          </label>
          <input
            type="number"
            id="totalSupply"
            value={formData.totalSupply}
            onChange={(e) => handleInputChange('totalSupply', e.target.value)}
            className={`input-field ${errors.totalSupply ? 'border-red-500' : ''}`}
            placeholder="1000000"
            min="1"
            step="1"
            disabled={isDeploying}
          />
          {errors.totalSupply && (
            <p className="mt-1 text-sm text-red-600">{errors.totalSupply}</p>
          )}
          
          {/* Supply Calculator */}
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Supply Calculator:</strong> With {formData.decimals} decimals, you'll get:
            </p>
            <div className="text-sm font-mono bg-white p-2 rounded border">
              {formData.totalSupply && parseFloat(formData.totalSupply) > 0 ? (
                <>
                  <div className="text-green-600">
                    {parseFloat(formData.totalSupply).toLocaleString()} tokens
                  </div>
                  <div className="text-gray-500 text-xs">
                    = {weiUnits} wei units (raw blockchain value)
                  </div>
                  <div className="text-blue-600 text-xs mt-1">
                    💡 Once added to MetaMask, it will display: {parseFloat(formData.totalSupply).toLocaleString()} tokens
                  </div>
                </>
              ) : (
                <span className="text-gray-400">Enter a total supply to see calculation</span>
              )}
            </div>
          </div>
          
          <p className="mt-2 text-sm text-gray-500">
            This will be the total number of tokens minted to your address
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
            className={`input-field ${errors.decimals ? 'border-red-500' : ''}`}
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
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>⚠️ Important:</strong> Decimals determine token precision
            </p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• <strong>0 decimals:</strong> 1 token = 1 unit (like Bitcoin)</li>
              <li>• <strong>6 decimals:</strong> 1 token = 1,000,000 units (like USDC)</li>
              <li>• <strong>18 decimals:</strong> 1 token = 1,000,000,000,000,000,000 units (like ETH)</li>
            </ul>
            <p className="text-xs text-yellow-700 mt-2">
              <strong>💡 Tip:</strong> Lower decimals = simpler numbers, Higher decimals = more precision
            </p>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isDeploying}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
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

        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You'll need some SHM tokens in your wallet to pay for gas fees. 
            Get testnet tokens from the <a href="https://docs.shardeum.org/docs/developer/faucet" target="_blank" rel="noopener noreferrer" className="underline">Shardeum Faucet</a>.
          </p>
        </div>
      </form>
    </div>
  )
}
