const { ethers } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();
  
  if (signers.length === 0) {
    console.error("❌ No signers found!");
    console.error("Please create a .env file with your PRIVATE_KEY:");
    console.error("PRIVATE_KEY=your_private_key_here");
    console.error("");
    console.error("Make sure to:");
    console.error("1. Create a .env file in the project root");
    console.error("2. Add your private key (without 0x prefix)");
    console.error("3. Have some SHM tokens in your wallet for gas fees");
    process.exit(1);
  }
  
  const [deployer] = signers;
  console.log("🚀 Deploying contracts with the account:", deployer.address);

  // Deploy CustomToken (like TestToken in your sample)
  const CustomToken = await ethers.getContractFactory("CustomToken");
  
  // CRITICAL FIX: Send the raw value directly, not parsed!
  // For 1M tokens with 18 decimals, we need: 1000000 * 10^18
  const totalSupply = 1000000n * (10n ** 18n); // 1M * 10^18 = 1,000,000,000,000,000,000,000,000
  
  const tokenA = await CustomToken.deploy("Token A", "TKA", 18, totalSupply);
  await tokenA.waitForDeployment();
  console.log("✅ Token A deployed to:", await tokenA.getAddress());

  const tokenB = await CustomToken.deploy("Token B", "TKB", 18, totalSupply);
  await tokenB.waitForDeployment();
  console.log("✅ Token B deployed to:", await tokenB.getAddress());

  // Verify the deployment
  console.log("\n📋 Token A Details:");
  console.log("  - Name:", await tokenA.name());
  console.log("  - Symbol:", await tokenA.symbol());
  console.log("  - Decimals:", await tokenA.decimals());
  console.log("  - Total Supply (raw blockchain):", totalSupply.toString());
  console.log("  - Total Supply (wallet display):", ethers.formatEther(totalSupply), "tokens");
  console.log("  - Deployer Balance:", ethers.formatEther(await tokenA.balanceOf(deployer.address)), "tokens");

  console.log("\n📋 Token B Details:");
  console.log("  - Name:", await tokenB.name());
  console.log("  - Symbol:", await tokenB.symbol());
  console.log("  - Decimals:", await tokenB.decimals());
  console.log("  - Total Supply (raw blockchain):", totalSupply.toString());
  console.log("  - Total Supply (wallet display):", ethers.formatEther(totalSupply), "tokens");
  console.log("  - Deployer Balance:", ethers.formatEther(await tokenB.balanceOf(deployer.address)), "tokens");

  console.log("\n🎉 Deployment successful! You can now:");
  console.log("  1. Add the tokens to MetaMask using their addresses");
  console.log("  2. Transfer tokens between addresses");
  console.log("  3. Mint additional tokens");
  console.log("  4. Use them in your DEX application");
  console.log("\n💡 Your wallet will display exactly 1,000,000 tokens for each!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
