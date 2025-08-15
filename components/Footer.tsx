import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ShardMint</h3>
            <p className="text-gray-600 text-sm">
              Mint tokens on Shardeum - The easiest way to create and deploy ERC-20 tokens on Shardeum Unstablenet. 
              No coding required, just fill in the details and deploy!
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://docs.shardeum.org/docs/developer/faucet" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  🚰 Shardeum Faucet
                </a>
              </li>
              <li>
                <a 
                  href="https://explorer-unstable.shardeum.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  🔍 Shardeum Explorer
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.shardeum.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  📚 Shardeum Documentation
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Info</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Network:</strong> Shardeum Unstablenet</p>
              <p><strong>Chain ID:</strong> 8080</p>
              <p><strong>RPC URL:</strong> api-unstable.shardeum.org</p>
              <p><strong>Currency:</strong> SHM</p>
              <p><strong>Token Format:</strong> Uses ethers.parseUnits() for accurate decimal handling</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            ShardMint - Built with ❤️ for the Shardeum community. This is a testnet application.
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Made by <a href="https://github.com/hozi8-web3" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">HOZI</a>
          </p>
        </div>

      </div>
    </footer>
  )
}
