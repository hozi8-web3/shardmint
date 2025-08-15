'use client'

import { useState, useEffect } from 'react'
import TokenDeployer from '../components/TokenDeployer'
import Header from '../components/Header'
import Footer from '../components/Footer'
import DeploymentHistory from '../components/DeploymentHistory'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState('')
  const [activeTab, setActiveTab] = useState<'deploy' | 'mint'>('deploy')
  const [deployedTokens, setDeployedTokens] = useState<any[]>([])
  const [selectedToken, setSelectedToken] = useState<any>(null)
  const [mintAmount, setMintAmount] = useState('')
  const [mintToAddress, setMintToAddress] = useState('')
  const [isMinting, setIsMinting] = useState(false)
  const [mintError, setMintError] = useState<string | null>(null)
  const [mintSuccess, setMintSuccess] = useState<string | null>(null)
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)
  const [showImportForm, setShowImportForm] = useState(false)
  const [importContractAddress, setImportContractAddress] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [showTransactionHistory, setShowTransactionHistory] = useState(false)
  const [transactionHistory, setTransactionHistory] = useState<any[]>([])
  const [isScanningHistory, setIsScanningHistory] = useState(false)
  const [showAdvancedScan, setShowAdvancedScan] = useState(false)
  const [customStartBlock, setCustomStartBlock] = useState('')
  const [customEndBlock, setCustomEndBlock] = useState('')
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, found: 0 })
  const [lastScannedBlock, setLastScannedBlock] = useState<number>(0)
  const [tokenProcessingProgress, setTokenProcessingProgress] = useState({ current: 0, total: 0, found: 0 })

  useEffect(() => {
    checkWalletConnection()
  }, [])

  useEffect(() => {
    if (isConnected && account) {
      loadDeployedTokensSmart()
    }
  }, [isConnected, account])

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setIsConnected(true)
          setAccount(accounts[0])
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }
  }

  // Smart token discovery using transaction history and targeted scanning
  const loadDeployedTokensSmart = async () => {
    if (!isConnected || !account) return
    
    setIsLoadingTokens(true)
    try {
      const { ethers } = await import('ethers')
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      
      // Load cached tokens first
      const cachedTokens = loadCachedTokens()
      setDeployedTokens(cachedTokens)
      console.log(`📋 Loaded ${cachedTokens.length} cached tokens`)
      
      // Strategy 1: Check transaction history for contract creation events
      console.log('🔍 Strategy 1: Checking transaction history for ALL contract creation events...')
      const contractCreationTxs = await findContractCreationTransactions(provider, account)
      
      if (contractCreationTxs.length > 0) {
        console.log(`🎯 Found ${contractCreationTxs.length} contract creation transactions, extracting token info...`)
        
        // Extract token information from discovered contracts
        const discoveredTokens = await extractTokenInfoFromContracts(provider, contractCreationTxs)
        console.log(`✅ Successfully extracted ${discoveredTokens.length} tokens from contracts`)
        
        // Merge with cached tokens
        const allTokens = mergeTokens(cachedTokens, discoveredTokens)
        console.log(`🔄 Merged tokens: ${cachedTokens.length} cached + ${discoveredTokens.length} discovered = ${allTokens.length} total`)
        
        setDeployedTokens(allTokens)
        
        // Cache the results
        cacheTokens(allTokens)
        
        // Update last scanned block for incremental scanning
        if (contractCreationTxs.length > 0) {
          const latestTx = contractCreationTxs.reduce((latest, tx) => 
            tx.blockNumber > latest.blockNumber ? tx : latest
          )
          setLastScannedBlock(latestTx.blockNumber)
          console.log(`📍 Updated last scanned block to: ${latestTx.blockNumber}`)
        }
      } else {
        console.log('⚠️ No contract creation transactions found in recent blocks')
      }
      
      // Strategy 2: Incremental scanning from last known position
      if (lastScannedBlock > 0) {
        console.log(`🔄 Strategy 2: Performing incremental scan from block ${lastScannedBlock}...`)
        const incrementalTokens = await performIncrementalScan(provider, account, lastScannedBlock)
        
        if (incrementalTokens.length > 0) {
          console.log(`🆕 Found ${incrementalTokens.length} additional tokens in incremental scan`)
          const allTokens = mergeTokens(deployedTokens, incrementalTokens)
          setDeployedTokens(allTokens)
          cacheTokens(allTokens)
        } else {
          console.log('✅ No additional tokens found in incremental scan')
        }
      }
      
      console.log(`🎉 Smart token discovery complete! Total tokens found: ${deployedTokens.length}`)
      
    } catch (error) {
      console.error('Error in smart token discovery:', error)
      // Fallback to cached tokens
      const cachedTokens = loadCachedTokens()
      setDeployedTokens(cachedTokens)
      console.log(`🔄 Fallback to cached tokens: ${cachedTokens.length} tokens`)
    } finally {
      setIsLoadingTokens(false)
    }
  }

  // Find contract creation transactions from user's transaction history
  const findContractCreationTransactions = async (provider: any, userAddress: string) => {
    try {
      const currentBlock = await provider.getBlockNumber()
      const startBlock = Math.max(0, currentBlock - 1000) // Last 1000 blocks
      
      console.log(`🔍 Scanning blocks ${startBlock} to ${currentBlock} for ALL contract creation events...`)
      
      const contractCreationTxs: any[] = []
      const batchSize = 50
      
      for (let i = startBlock; i <= currentBlock; i += batchSize) {
        const endBlock = Math.min(i + batchSize - 1, currentBlock)
        
        try {
          const block = await provider.getBlock(endBlock, true)
          if (block && block.transactions) {
            console.log(`📦 Processing block ${endBlock} with ${block.transactions.length} transactions...`)
            
            for (const txHash of block.transactions) {
              try {
                const tx = await provider.getTransaction(txHash)
                if (tx && tx.to === null && tx.from?.toLowerCase() === userAddress.toLowerCase()) {
                  // This is a contract creation transaction from our user
                  console.log(`🎯 Found contract creation transaction: ${tx.hash}`)
                  
                  try {
                    const receipt = await provider.getTransactionReceipt(tx.hash)
                    if (receipt && receipt.contractAddress) {
                      const newContractTx = {
                        hash: tx.hash,
                        blockNumber: endBlock,
                        contractAddress: receipt.contractAddress,
                        timestamp: block.timestamp
                      }
                      
                      // Check if we already have this contract address
                      if (!contractCreationTxs.find(existing => existing.contractAddress === receipt.contractAddress)) {
                        contractCreationTxs.push(newContractTx)
                        console.log(`✅ Added new contract: ${receipt.contractAddress} (Total found: ${contractCreationTxs.length})`)
                      } else {
                        console.log(`⚠️ Contract already found: ${receipt.contractAddress}`)
                      }
                    }
                  } catch (receiptError) {
                    console.log('Could not get receipt for transaction:', tx.hash)
                  }
                }
              } catch (txError) {
                // Skip failed transactions
              }
            }
          }
        } catch (blockError) {
          console.log(`Error scanning block ${endBlock}:`, blockError)
        }
      }
      
      console.log(`🎉 Scan complete! Found ${contractCreationTxs.length} unique contract creation transactions`)
      return contractCreationTxs
    } catch (error) {
      console.error('Error finding contract creation transactions:', error)
      return []
    }
  }

  // Extract token information from discovered contract addresses
  const extractTokenInfoFromContracts = async (provider: any, contractTxs: any[]) => {
    const { ethers } = await import('ethers')
    const tokens: any[] = []
    
    console.log(`🔍 Processing ${contractTxs.length} contract addresses for token information...`)
    
    // Set initial progress
    setTokenProcessingProgress({ current: 0, total: contractTxs.length, found: 0 })
    
    for (let i = 0; i < contractTxs.length; i++) {
      const tx = contractTxs[i]
      console.log(`📋 Processing contract ${i + 1}/${contractTxs.length}: ${tx.contractAddress}`)
      
      // Update progress
      setTokenProcessingProgress(prev => ({ ...prev, current: i + 1 }))
      
      try {
        // Try to verify this is our CustomToken contract
        const contract = new ethers.Contract(
          tx.contractAddress,
          [
            "function name() external view returns (string)",
            "function symbol() external view returns (string)",
            "function decimals() external view returns (uint8)",
            "function totalSupply() external view returns (uint256)",
            "function cap() external view returns (uint256)",
            "function logoUrl() external view returns (string)",
            "function description() external view returns (string)"
          ],
          provider
        )
        
        // Check if this contract has our expected functions
        const [name, symbol, decimals, totalSupply, cap, logoUrl, description] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
          contract.totalSupply(),
          contract.cap(),
          contract.logoUrl(),
          contract.description()
        ])
        
        // Format the amounts based on decimals
        const formatAmount = (amount: bigint, decimals: number) => {
          return decimals === 18 
            ? ethers.formatEther(amount)
            : ethers.formatUnits(amount, decimals)
        }
        
        const tokenData = {
          name,
          symbol,
          initialSupply: formatAmount(totalSupply, decimals),
          maxSupply: formatAmount(cap, decimals),
          decimals,
          logo: logoUrl,
          description
        }
        
        const tokenInfo = {
          contractAddress: tx.contractAddress,
          transactionHash: tx.hash,
          tokenData: ensureSerializable(tokenData),
          timestamp: tx.timestamp * 1000
        }
        
        tokens.push(tokenInfo)
        console.log(`✅ Successfully processed token ${i + 1}/${contractTxs.length}: ${name} (${symbol})`)
        
        // Update found count
        setTokenProcessingProgress(prev => ({ ...prev, found: tokens.length }))
        
      } catch (contractError: any) {
        console.log(`❌ Contract verification failed for ${tx.contractAddress}:`, contractError?.message || 'Unknown error')
        console.log(`⚠️ Skipping contract ${i + 1}/${contractTxs.length}`)
      }
    }
    
    console.log(`🎉 Token extraction complete! Successfully processed ${tokens.length}/${contractTxs.length} contracts`)
    
    // Reset progress
    setTokenProcessingProgress({ current: 0, total: 0, found: 0 })
    
    return tokens
  }

  // Perform incremental scanning from a specific block
  const performIncrementalScan = async (provider: any, userAddress: string, fromBlock: number) => {
    try {
      const currentBlock = await provider.getBlockNumber()
      const endBlock = Math.min(fromBlock + 100, currentBlock) // Scan next 100 blocks
      
      console.log(`Incremental scan: blocks ${fromBlock} to ${endBlock}`)
      
      const contractCreationTxs = await findContractCreationTransactions(provider, userAddress)
      const incrementalTokens = await extractTokenInfoFromContracts(provider, contractCreationTxs)
      
      return incrementalTokens
    } catch (error) {
      console.error('Error in incremental scan:', error)
      return []
    }
  }

  // Cache management functions
  const loadCachedTokens = (): any[] => {
    try {
      const savedTokens = localStorage.getItem('deployedTokens')
      return savedTokens ? JSON.parse(savedTokens) : []
    } catch (error) {
      console.error('Error loading cached tokens:', error)
      return []
    }
  }

  const cacheTokens = (tokens: any[]) => {
    try {
      localStorage.setItem('deployedTokens', JSON.stringify(tokens))
    } catch (error) {
      console.error('Error caching tokens:', error)
    }
  }

  const mergeTokens = (existing: any[], newTokens: any[]): any[] => {
    const merged = [...existing]
    
    for (const newToken of newTokens) {
      if (!merged.find(t => t.contractAddress === newToken.contractAddress)) {
        merged.push(newToken)
      }
    }
    
    return merged
  }

  // Quick transaction history scan for immediate feedback
  const scanTransactionHistory = async () => {
    if (!account) return
    
    setIsScanningHistory(true)
    try {
      const { ethers } = await import('ethers')
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      
      // Get recent transactions for the user
      const currentBlock = await provider.getBlockNumber()
      const startBlock = Math.max(0, currentBlock - 100) // Last 100 blocks
      
      console.log(`🔍 Quick scan: blocks ${startBlock} to ${currentBlock} for ALL transactions...`)
      
      const transactions: any[] = []
      const foundContractAddresses = new Set() // Track unique contract addresses
      
      for (let i = startBlock; i <= currentBlock; i++) {
        try {
          const block = await provider.getBlock(i, true)
          if (block && block.transactions) {
            console.log(`📦 Processing block ${i} with ${block.transactions.length} transactions...`)
            
            for (const txHash of block.transactions) {
              try {
                const tx = await provider.getTransaction(txHash)
                if (tx && tx.from?.toLowerCase() === account.toLowerCase()) {
                  const receipt = await provider.getTransactionReceipt(tx.hash)
                  
                  const transactionInfo = {
                    hash: tx.hash,
                    blockNumber: i,
                    timestamp: block.timestamp,
                    to: tx.to,
                    value: tx.value,
                    gasUsed: receipt?.gasUsed,
                    status: receipt?.status,
                    contractAddress: receipt?.contractAddress,
                    isContractCreation: tx.to === null
                  }
                  
                  transactions.push(transactionInfo)
                  
                  // Track unique contract addresses
                  if (receipt?.contractAddress && !foundContractAddresses.has(receipt.contractAddress)) {
                    foundContractAddresses.add(receipt.contractAddress)
                    console.log(`🎯 Found new contract creation: ${receipt.contractAddress}`)
                  }
                }
              } catch (txError) {
                // Skip failed transactions
              }
            }
          }
        } catch (blockError) {
          // Skip failed blocks
        }
      }
      
      setTransactionHistory(transactions)
      console.log(`📊 Found ${transactions.length} total transactions, ${foundContractAddresses.size} unique contracts`)
      
      // If we found contract creation transactions, extract token info immediately
      const contractCreationTxs = transactions.filter(tx => tx.isContractCreation)
      if (contractCreationTxs.length > 0) {
        console.log(`🎯 Found ${contractCreationTxs.length} contract creation transactions, extracting token info...`)
        const newTokens = await extractTokenInfoFromContracts(provider, contractCreationTxs)
        
        if (newTokens.length > 0) {
          console.log(`✅ Successfully extracted ${newTokens.length} new tokens`)
          const allTokens = mergeTokens(deployedTokens, newTokens)
          setDeployedTokens(allTokens)
          cacheTokens(allTokens)
        }
      }
      
    } catch (error) {
      console.error('Error scanning transaction history:', error)
    } finally {
      setIsScanningHistory(false)
    }
  }

  // Custom block range scanning (much more efficient now)
  const scanCustomBlockRange = async () => {
    if (!customStartBlock || !customEndBlock) {
      alert('Please enter both start and end block numbers')
      return
    }

    const startBlock = parseInt(customStartBlock)
    const endBlock = parseInt(customEndBlock)

    if (startBlock < 0 || endBlock < startBlock) {
      alert('Invalid block range. Start block must be >= 0 and end block must be >= start block')
      return
    }

    setIsLoadingTokens(true)
    setScanProgress({ current: 0, total: endBlock - startBlock + 1, found: 0 })

    try {
      const { ethers } = await import('ethers')
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      
      // Use the efficient transaction scanning approach
      const contractCreationTxs = await findContractCreationTransactionsInRange(provider, account, startBlock, endBlock)
      const discoveredTokens = await extractTokenInfoFromContracts(provider, contractCreationTxs)
      
      // Merge with existing tokens
      const currentTokens = [...deployedTokens]
      for (const newToken of discoveredTokens) {
        if (!currentTokens.find(t => t.contractAddress === newToken.contractAddress)) {
          currentTokens.push(newToken)
        }
      }
      
      setDeployedTokens(currentTokens)
      cacheTokens(currentTokens)
      
      console.log(`🎯 Custom block range scan completed. Found ${discoveredTokens.length} new tokens.`)
      setShowAdvancedScan(false)
      setCustomStartBlock('')
      setCustomEndBlock('')
      
    } catch (error) {
      console.error('Error in custom block range scan:', error)
      alert('Error scanning custom block range. Please try again.')
    } finally {
      setIsLoadingTokens(false)
      setScanProgress({ current: 0, total: 0, found: 0 })
    }
  }

  // Efficient scanning within a specific block range
  const findContractCreationTransactionsInRange = async (provider: any, userAddress: string, startBlock: number, endBlock: number) => {
    const contractCreationTxs: any[] = []
    const scanBatchSize = 50
    
    console.log(`🔍 Custom range scan: blocks ${startBlock} to ${endBlock} for ALL contract creation events...`)
    
    for (let i = startBlock; i <= endBlock; i += scanBatchSize) {
      const currentEndBlock = Math.min(i + scanBatchSize - 1, endBlock)
      
      try {
        const block = await provider.getBlock(currentEndBlock, true)
        if (block && block.transactions) {
          console.log(`📦 Processing block ${currentEndBlock} with ${block.transactions.length} transactions...`)
          
          for (const txHash of block.transactions) {
            try {
              const tx = await provider.getTransaction(txHash)
              if (tx && tx.to === null && tx.from?.toLowerCase() === userAddress.toLowerCase()) {
                console.log(`🎯 Found contract creation transaction: ${tx.hash}`)
                
                try {
                  const receipt = await provider.getTransactionReceipt(tx.hash)
                  if (receipt && receipt.contractAddress) {
                    const newContractTx = {
                      hash: tx.hash,
                      blockNumber: currentEndBlock,
                      contractAddress: receipt.contractAddress,
                      timestamp: block.timestamp
                    }
                    
                    // Check if we already have this contract address
                    if (!contractCreationTxs.find(existing => existing.contractAddress === receipt.contractAddress)) {
                      contractCreationTxs.push(newContractTx)
                      console.log(`✅ Added new contract: ${receipt.contractAddress} (Total found: ${contractCreationTxs.length})`)
                    } else {
                      console.log(`⚠️ Contract already found: ${receipt.contractAddress}`)
                    }
                  }
                } catch (receiptError) {
                  console.log('Could not get receipt for transaction:', tx.hash)
                }
              }
            } catch (txError) {
              console.log('Could not get transaction details for hash:', txHash)
            }
          }
        }
      } catch (blockError) {
        console.log(`Error scanning block ${currentEndBlock}:`, blockError)
      }
      
      setScanProgress(prev => ({ ...prev, current: currentEndBlock - startBlock + 1, found: contractCreationTxs.length }))
    }
    
    console.log(`🎉 Custom range scan complete! Found ${contractCreationTxs.length} unique contract creation transactions`)
    return contractCreationTxs
  }

  const handleMint = async () => {
    if (!selectedToken || !mintAmount || !mintToAddress) {
      setMintError('Please select a token and fill in both amount and recipient address')
      return
    }

    const amount = parseInt(mintAmount)
    if (amount <= 0) {
      setMintError('Amount must be greater than 0')
      return
    }

    // Calculate remaining mintable (simplified - you might want to fetch from blockchain)
    const currentSupply = parseInt(selectedToken.tokenData.initialSupply)
    const maxSupply = parseInt(selectedToken.tokenData.maxSupply)
    const remainingMintable = maxSupply - currentSupply

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
        selectedToken.contractAddress,
        [
          "function mint(address to, uint256 amount) external",
          "function totalSupply() external view returns (uint256)"
        ],
        signer
      )

      // Calculate the amount with proper decimals
      const mintAmountWei = selectedToken.tokenData.decimals === 18 
        ? ethers.parseEther(mintAmount)
        : ethers.parseUnits(mintAmount, selectedToken.tokenData.decimals)

      // Mint tokens
      const tx = await contract.mint(mintToAddress, mintAmountWei)
      
      // Show immediate success message
      setMintSuccess(`✅ Transaction sent! Minting ${amount.toLocaleString()} ${selectedToken.tokenData.symbol} to ${mintToAddress.slice(0, 6)}...${mintToAddress.slice(-4)}... Transaction: ${tx.hash.slice(0, 10)}...`)
      
      // Clear form immediately
      setMintAmount('')
      setMintToAddress('')
      
      // Stop loading immediately
      setIsMinting(false)
      
      // Start monitoring transaction status independently
      const monitorTransaction = async () => {
        try {
          const receipt = await provider.getTransactionReceipt(tx.hash)
          if (receipt && receipt.status === 1) {
            console.log('Mint transaction confirmed:', receipt)
            setMintSuccess(`✅ Successfully minted ${amount.toLocaleString()} ${selectedToken.tokenData.symbol} to ${mintToAddress.slice(0, 6)}...${mintToAddress.slice(-4)}! Transaction: ${tx.hash.slice(0, 10)}...`)
            
            // Reload tokens to show updated info
            loadDeployedTokensSmart()
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
        }
      }, 1000) // Check every 1 second
      
    } catch (error: any) {
      console.error('Minting error:', error)
      setMintError(error.message || 'Failed to mint tokens')
      setIsMinting(false)
    }
  }

  const handleImportToken = async () => {
    if (!importContractAddress) {
      setImportError('Contract address cannot be empty')
      return
    }

    setIsImporting(true)
    setImportError(null)

    try {
      const { ethers } = await import('ethers')
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()

      const contract = new ethers.Contract(
        importContractAddress,
        [
          "function name() external view returns (string)",
          "function symbol() external view returns (string)",
          "function decimals() external view returns (uint8)",
          "function totalSupply() external view returns (uint256)",
          "function cap() external view returns (uint256)",
          "function logoUrl() external view returns (string)",
          "function description() external view returns (string)"
        ],
        signer
      )

      const [name, symbol, decimals, totalSupply, cap, logoUrl, description] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.cap(),
        contract.logoUrl(),
        contract.description()
      ])

      const formatAmount = (amount: bigint, decimals: number) => {
        return decimals === 18 
          ? ethers.formatEther(amount)
          : ethers.formatUnits(amount, decimals)
      }

      const tokenData = {
        name,
        symbol,
        initialSupply: formatAmount(totalSupply, decimals),
        maxSupply: formatAmount(cap, decimals),
        decimals,
        logo: logoUrl,
        description
      }

      const tokenInfo = {
        contractAddress: importContractAddress,
        transactionHash: 'N/A', // No transaction hash for manual import
        tokenData: ensureSerializable(tokenData),
        timestamp: Date.now() // Current timestamp
      }

      // Get current tokens and add new one
      const currentTokens = [...deployedTokens]
      currentTokens.push(tokenInfo)
      
      // Update state
      setDeployedTokens(currentTokens)
      
      // Save to localStorage - ensure all values are serializable
      try {
        localStorage.setItem('deployedTokens', JSON.stringify(currentTokens))
      } catch (localStorageError) {
        console.error('Error saving to localStorage:', localStorageError)
        // If localStorage fails, we can still use the token in memory
      }
      
      setImportContractAddress('')
      setShowImportForm(false)
      setImportError(null)
      console.log('Successfully imported token:', tokenInfo)
    } catch (error: any) {
      console.error('Error importing token:', error)
      setImportError(error.message || 'Failed to import token')
    } finally {
      setIsImporting(false)
    }
  }

  // Helper function to ensure token data is serializable
  const ensureSerializable = (tokenData: any) => {
    return {
      ...tokenData,
      // Ensure all numeric values are strings
      initialSupply: String(tokenData.initialSupply),
      maxSupply: String(tokenData.maxSupply),
      decimals: Number(tokenData.decimals),
      // Ensure other fields are strings
      name: String(tokenData.name),
      symbol: String(tokenData.name),
      logo: String(tokenData.logo),
      description: String(tokenData.description)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header 
        isConnected={isConnected} 
        account={account}
        onConnect={checkWalletConnection}
      />
      
      <main className="flex-1 container mx-auto px-4 py-8" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="text-center mb-12" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="flex justify-center mb-6" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <img src="/logo-large.svg" alt="ShardMint Logo" className="h-20" style={{ height: '5rem' }} />
          </div>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: '#4b5563', maxWidth: '42rem', margin: '0 auto' }}>
            Mint tokens on Shardeum - Create and deploy your own ERC-20 token on Shardeum Unstablenet in minutes. 
            No coding required - just fill in the details and deploy!
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('deploy')}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
                activeTab === 'deploy'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🚀 Deploy New Token
            </button>
            <button
              onClick={() => setActiveTab('mint')}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
                activeTab === 'mint'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🪙 Mint More Tokens
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'deploy' && (
          <TokenDeployer 
            isConnected={isConnected}
            account={account}
          />
        )}

        {activeTab === 'mint' && (
          <div className="max-w-4xl mx-auto">
            {!isConnected ? (
              <div className="card text-center max-w-4xl mx-auto">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-600 mb-6">
                  Please connect your MetaMask wallet to mint additional tokens
                </p>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Network:</strong> Shardeum Unstablenet (Chain ID: 8080)
                  </p>
                </div>
              </div>
            ) : isLoadingTokens ? (
              <div className="card text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Scanning Blockchain
                </h2>
                <p className="text-gray-600 mb-6">
                  Searching for your deployed tokens on the blockchain...
                </p>
                
                {/* Token Processing Progress */}
                {tokenProcessingProgress.total > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">📋 Processing Discovered Contracts</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-blue-800">
                        <span>Progress: {tokenProcessingProgress.current} / {tokenProcessingProgress.total} contracts</span>
                        <span>Successfully processed: {tokenProcessingProgress.found} tokens</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${(tokenProcessingProgress.current / tokenProcessingProgress.total) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-blue-700">
                        Verifying contract interfaces and extracting token information...
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            ) : deployedTokens.length === 0 ? (
              <div className="card text-center max-w-4xl mx-auto">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  No Tokens Found
                </h2>
                <p className="text-gray-600 mb-6">
                  No deployed tokens found for your address. You can either scan the blockchain or manually import your token.
                </p>
                <div className="flex justify-center space-x-4 mb-6">
                  <button
                    onClick={loadDeployedTokensSmart}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                  >
                    🔄 Scan Blockchain
                  </button>
                  <button
                    onClick={() => setShowImportForm(true)}
                    className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                  >
                    📥 Import Token
                  </button>
                  <button
                    onClick={scanTransactionHistory}
                    disabled={isScanningHistory}
                    className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isScanningHistory ? 'Scanning...' : '📊 Transaction History'}
                  </button>
                  <button
                    onClick={() => setShowAdvancedScan(!showAdvancedScan)}
                    className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
                  >
                    🔍 Advanced Scan
                  </button>
                </div>
                
                {/* Advanced Scanning Options */}
                {showAdvancedScan && (
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-3">🔍 Advanced Blockchain Scanning</h4>
                    <p className="text-orange-800 text-sm mb-4">
                      Scan specific block ranges to find tokens deployed at any point in blockchain history. 
                      This is useful for finding old tokens that might not appear in recent block scans.
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-orange-800 mb-1">
                          Start Block
                        </label>
                        <input
                          type="number"
                          value={customStartBlock}
                          onChange={(e) => setCustomStartBlock(e.target.value)}
                          className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-orange-800 mb-1">
                          End Block
                        </label>
                        <input
                          type="number"
                          value={customEndBlock}
                          onChange={(e) => setCustomEndBlock(e.target.value)}
                          className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Latest"
                          min="0"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={scanCustomBlockRange}
                          disabled={!customStartBlock || !customEndBlock || isLoadingTokens}
                          className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                        >
                          {isLoadingTokens ? 'Scanning...' : 'Start Scan'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Quick Scan Options */}
                    <div className="mb-4 p-3 bg-orange-100 rounded-lg">
                      <p className="text-sm text-orange-800 mb-2">
                        <strong>Quick Scan Options:</strong>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const { ethers } = await import('ethers')
                              const provider = new ethers.BrowserProvider(window.ethereum as any)
                              const currentBlock = await provider.getBlockNumber()
                              setCustomStartBlock('0')
                              setCustomEndBlock(currentBlock.toString())
                            } catch (error) {
                              console.error('Error getting current block:', error)
                            }
                          }}
                          className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors"
                        >
                          📍 Scan from Block 0
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const { ethers } = await import('ethers')
                              const provider = new ethers.BrowserProvider(window.ethereum as any)
                              const currentBlock = await provider.getBlockNumber()
                              const startBlock = Math.max(0, currentBlock - 10000)
                              setCustomStartBlock(startBlock.toString())
                              setCustomEndBlock(currentBlock.toString())
                            } catch (error) {
                              console.error('Error getting current block:', error)
                            }
                          }}
                          className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors"
                        >
                          🔍 Last 10K Blocks
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const { ethers } = await import('ethers')
                              const provider = new ethers.BrowserProvider(window.ethereum as any)
                              const currentBlock = await provider.getBlockNumber()
                              const startBlock = Math.max(0, currentBlock - 50000)
                              setCustomStartBlock(startBlock.toString())
                              setCustomEndBlock(currentBlock.toString())
                            } catch (error) {
                              console.error('Error getting current block:', error)
                            }
                          }}
                          className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors"
                        >
                          🔍 Last 50K Blocks
                        </button>
                      </div>
                    </div>
                    
                    {/* Progress Indicator */}
                    {isLoadingTokens && scanProgress.total > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-orange-800">
                          <span>Progress: {scanProgress.current} / {scanProgress.total} blocks</span>
                          <span>Found: {scanProgress.found} tokens</span>
                        </div>
                        <div className="w-full bg-orange-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-orange-700 space-y-1">
                      <p><strong>💡 Tips:</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Start with block 0 to scan the entire blockchain</li>
                        <li>Use smaller ranges (e.g., 1000 blocks) for faster scanning</li>
                        <li>Check transaction history first to identify relevant block ranges</li>
                        <li>Scanning from block 0 may take several minutes depending on network size</li>
                      </ul>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setActiveTab('deploy')}
                  className="btn-primary mt-4"
                >
                  🚀 Deploy Your First Token
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Select Token to Mint</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={loadDeployedTokensSmart}
                        className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      >
                        🔄 Rescan
                      </button>
                      <button
                        onClick={() => setShowImportForm(true)}
                        className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                      >
                        📥 Import More
                      </button>
                      <div className="text-sm text-gray-500 flex items-center">
                        Found {deployedTokens.length} token{deployedTokens.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {deployedTokens.map((token, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedToken(token)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedToken?.contractAddress === token.contractAddress
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-gray-900">{token.tokenData.name} ({token.tokenData.symbol})</h4>
                            <p className="text-sm text-gray-600">
                              Contract: {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Initial Supply: {parseInt(token.tokenData.initialSupply).toLocaleString()} | 
                              Max Supply: {parseInt(token.tokenData.maxSupply).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Decimals: {token.tokenData.decimals}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(token.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedToken && (
                  <div className="card">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Mint Additional {selectedToken.tokenData.symbol} Tokens
                    </h3>
                    
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Token Information</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                        <div>
                          <strong>Token:</strong> {selectedToken.tokenData.name} ({selectedToken.tokenData.symbol})
                        </div>
                        <div>
                          <strong>Contract:</strong> {selectedToken.contractAddress.slice(0, 6)}...{selectedToken.contractAddress.slice(-4)}
                        </div>
                        <div>
                          <strong>Initial Supply:</strong> {parseInt(selectedToken.tokenData.initialSupply).toLocaleString()} {selectedToken.tokenData.symbol}
                        </div>
                        <div>
                          <strong>Max Supply:</strong> {parseInt(selectedToken.tokenData.maxSupply).toLocaleString()} {selectedToken.tokenData.symbol}
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
                          placeholder="Enter amount to mint"
                          min="1"
                          disabled={isMinting}
                        />
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
                        disabled={isMinting || !mintAmount || !mintToAddress}
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
                          `🪙 Mint ${mintAmount || '0'} ${selectedToken.tokenData.symbol}`
                        )}
                      </button>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes:</h4>
                      <ul className="text-yellow-800 space-y-1 text-sm">
                        <li>• Only you (the token owner) can mint additional tokens</li>
                        <li>• You cannot exceed the maximum supply</li>
                        <li>• Minted tokens will be sent directly to the specified recipient address</li>
                        <li>• Each mint operation requires a separate transaction and gas fees</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Token Import Form */}
            {showImportForm && (
              <div className="card mt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Import Token Manually</h3>
                <p className="text-gray-600 mb-4">
                  If blockchain scanning failed, you can manually import your token by providing the contract address.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="contractAddress" className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Address *
                    </label>
                    <input
                      type="text"
                      id="contractAddress"
                      value={importContractAddress}
                      onChange={(e) => setImportContractAddress(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                      placeholder="0x..."
                    />
                  </div>

                  {importError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{importError}</p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={handleImportToken}
                      disabled={!importContractAddress || isImporting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      {isImporting ? 'Importing...' : 'Import Token'}
                    </button>
                    <button
                      onClick={() => setShowImportForm(false)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction History */}
            {transactionHistory.length > 0 && (
              <div className="card mt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Transaction History</h3>
                <p className="text-gray-600 mb-4">
                  Here are your recent transactions. Look for contract creation transactions (where "To" is empty) to find deployed tokens.
                </p>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactionHistory.map((tx, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              tx.isContractCreation ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {tx.isContractCreation ? 'Contract Creation' : 'Transaction'}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              tx.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {tx.status === 1 ? 'Success' : 'Failed'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Hash:</span>
                              <code className="ml-1 bg-gray-100 px-1 rounded text-xs">
                                {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                              </code>
                            </div>
                            <div>
                              <span className="text-gray-500">Block:</span>
                              <span className="ml-1">{tx.blockNumber}</span>
                            </div>
                            {tx.contractAddress && (
                              <div className="col-span-2">
                                <span className="text-gray-500">Contract:</span>
                                <code className="ml-1 bg-green-100 px-1 rounded text-xs">
                                  {tx.contractAddress.slice(0, 8)}...{tx.contractAddress.slice(-6)}
                                </code>
                                <button
                                  onClick={() => {
                                    setImportContractAddress(tx.contractAddress)
                                    setShowImportForm(true)
                                  }}
                                  className="ml-2 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                                >
                                  Import
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right text-xs text-gray-500">
                          {new Date(tx.timestamp * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setTransactionHistory([])}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  >
                    Hide Transaction History
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {isConnected && <DeploymentHistory account={account} />}
      </main>

      <Footer />
    </div>
  )
}
