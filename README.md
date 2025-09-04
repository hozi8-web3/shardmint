<p align="center">
  <img src="public/logo-large.svg" alt="ShardMint Logo" width="200" />
</p>

Mint tokens on Shardeum - A complete full-stack dApp that allows users to create and deploy their own ERC-20 tokens on the **Shardeum Unstablenet** (Smart Contract Testnet) with just a few clicks!

## ✨ Features

- **🔗 MetaMask Integration**: Seamless wallet connection and network switching
- **🚀 One-Click Deployment**: Deploy ERC-20 tokens without writing any code
- **📱 Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **🔒 Secure**: Uses OpenZeppelin's battle-tested ERC-20 standard
- **📊 Real-time Updates**: Live deployment status and transaction tracking
- **💾 Local Storage**: Track your deployed tokens locally
- **🌐 Explorer Integration**: Direct links to Shardeum Explorer

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Ethers.js v6 + Web3
- **Smart Contracts**: Solidity + OpenZeppelin
- **Development**: Hardhat + Node.js
- **Deployment**: Vercel-ready
- **Database**: MongoDB (Mongoose) for interaction analytics

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MetaMask wallet extension
- Some SHM testnet tokens (get from [Shardeum Faucet](https://docs.shardeum.org/docs/developer/faucet))

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/hozi8-web3/shardmint
   cd shardmint
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   Create `.env.local` in the project root:
   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
   MONGODB_DB=shardeum_dapp
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Smart Contract Development

1. **Install Hardhat dependencies**
   ```bash
   npm install --save-dev @nomicfoundation/hardhat-toolbox
   ```

2. **Compile contracts**
   ```bash
   npx hardhat compile
   ```

3. **Run tests** (optional)
   ```bash
   npx hardhat test
   ```

4. **Deploy to testnet**
   ```bash
   npx hardhat run scripts/deploy.js --network shardeumUnstable
   ```

## 🌐 Network Configuration

### Shardeum Unstablenet
- **Network Name**: Shardeum Unstablenet
- **RPC URL**: `https://api-unstable.shardeum.org`
- **Chain ID**: `8080`
- **Currency Symbol**: `SHM`
- **Block Explorer**: `https://explorer-unstable.shardeum.org`

### Adding to MetaMask
The dApp will automatically prompt you to add the network to MetaMask, or you can add it manually:

1. Open MetaMask
2. Click "Add Network"
3. Use the details above
4. Save and switch to the network

## 📱 Usage

### 1. Connect Wallet
- Click "Connect Wallet" button
- Approve MetaMask connection
- Ensure you're on Shardeum Unstablenet

### 2. Fill Token Details
- **Token Name**: Your token's full name (e.g., "My Awesome Token")
- **Token Symbol**: Short symbol (e.g., "MAT")
- **Total Supply**: Number of tokens to mint
- **Decimals**: Token precision (0-18, 18 is standard)

**⚠️ Important: Understanding Decimals**
- **0 decimals**: 1 token = 1 unit (like Bitcoin)
- **6 decimals**: 1 token = 1,000,000 units (like USDC)
- **18 decimals**: 1 token = 1,000,000,000,000,000,000 units (like ETH)

**Example**: If you enter 1,000,000 with 18 decimals, you'll get 1,000,000,000,000,000,000,000,000 wei units in your wallet!

### 3. Deploy
- Click "🚀 Deploy Token"
- Confirm transaction in MetaMask
- Wait for deployment confirmation

### 4. View Results
- Copy contract address and transaction hash
- View on Shardeum Explorer
- **Add token to MetaMask** (important!)
- Deploy another token or disconnect

### 5. Add Token to MetaMask
**Important**: Custom ERC-20 tokens don't automatically appear in MetaMask!

**Option A: Use the dApp (Recommended)**
- Click "🪙 Add to MetaMask" button after deployment
- MetaMask will prompt you to add the token
- Confirm the token details and import

**Option B: Manual Addition**
- Copy the contract address from deployment results
- In MetaMask: Assets → Import tokens → Paste contract address
- Verify token symbol and decimals
- Click "Add Custom Token"

## 📁 Project Structure

 ```
 shardmint/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/             # React components
├── lib/                    # Backend helpers
│   ├── db.ts               # MongoDB connection helper
│   └── models/
│       └── Interaction.ts  # Mongoose model for interactions
├── app/api/                # Next.js Route Handlers
│   └── interactions/
│       ├── start/route.ts  # Start interaction endpoint
│       ├── complete/route.ts # Complete interaction endpoint
│       └── stats/route.ts  # Aggregated stats endpoint
│   ├── Header.tsx         # Navigation header
│   ├── TokenDeployer.tsx  # Main deployment logic
│   ├── TokenForm.tsx      # Token creation form
│   ├── DeploymentStatus.tsx # Deployment progress
│   ├── TokenInfo.tsx      # Success results
│   └── Footer.tsx         # Page footer
├── contracts/              # Smart contracts
│   ├── CustomToken.sol    # ERC-20 token contract
│   ├── TokenABI.json      # Contract ABI
│   └── TokenBytecode.js   # Contract bytecode
├── scripts/                # Deployment scripts
│   └── deploy.js          # Hardhat deployment script
├── types/                  # TypeScript types
│   └── global.d.ts        # Global type declarations
├── hardhat.config.js       # Hardhat configuration
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── package.json            # Dependencies and scripts
├── vercel.json             # Vercel deployment config
└── README.md               # This file
```

### Testnet Testing
1. Get testnet SHM from [Shardeum Faucet](https://docs.shardeum.org/docs/developer/faucet)
2. Connect MetaMask to Shardeum Unstablenet
3. Deploy test tokens
4. Verify on [Shardeum Explorer](https://explorer-unstable.shardeum.org)

## 🔒 Security

- **OpenZeppelin**: Uses industry-standard, audited contracts
- **Input Validation**: Client-side form validation
- **Network Verification**: Ensures correct network connection
- **Error Handling**: Comprehensive error handling and user feedback

## 🐛 Troubleshooting

### Common Issues

1. **"MetaMask not detected"**
   - Install MetaMask browser extension
   - Refresh the page

2. **"Wrong network"**
   - Switch to Shardeum Unstablenet (Chain ID: 8080)
   - The dApp will prompt you to add the network

3. **"Insufficient funds"**
   - Get testnet SHM from [Shardeum Faucet](https://faucet.shardeum.org)
   - Ensure you have enough for gas fees

4. **"Transaction failed"**
   - Check network congestion
   - Verify sufficient gas fees
   - Try again with higher gas limit

5. **"Token deployed but not showing in wallet"**
   - **This is normal!** Custom ERC-20 tokens don't auto-appear in MetaMask
   - Use the "Add to MetaMask" button in the dApp after deployment
   - Or manually add: MetaMask → Import tokens → Paste contract address
   - Verify you're on the correct network (Shardeum Unstablenet)

6. **"Token shows extremely large numbers in wallet"**
   - **This is normal!** You're seeing wei units, not token amounts
   - **Example**: 1,000,000 tokens with 18 decimals = 1,000,000,000,000,000,000,000,000 wei
   - **Solution**: Use lower decimals (0, 6, or 8) for simpler numbers
   - **Or**: Enter smaller total supply values (like 1 instead of 1,000,000)

### Debug Mode
Enable console logging for debugging:
```javascript
// In browser console
localStorage.setItem('debug', 'true')
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shardeum Team** for the amazing testnet
- **OpenZeppelin** for secure smart contract libraries
- **Ethers.js** for excellent Web3 integration
- **Next.js** for the powerful React framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/hozi8-web3/shardmint/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hozi8-web3/shardmint/discussions)
- **Documentation**: [Shardeum Docs](https://docs.shardeum.org)

---

**Happy Token Deploying! 🚀✨**

Built with ❤️ for the Shardeum community.
