const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Token parameters
  const tokenName = "My Custom Token";
  const tokenSymbol = "MCT";
  const totalSupply = 1000000; // 1 million tokens
  const decimals = 18;

  const CustomToken = await hre.ethers.getContractFactory("CustomToken");
  const customToken = await CustomToken.deploy(
    tokenName,
    tokenSymbol,
    totalSupply,
    decimals
  );

  await customToken.deployed();

  console.log("CustomToken deployed to:", customToken.address);
  console.log("Token Name:", tokenName);
  console.log("Token Symbol:", tokenSymbol);
  console.log("Total Supply:", totalSupply);
  console.log("Decimals:", decimals);

  // Verify the deployment
  const deployedToken = await CustomToken.attach(customToken.address);
  const name = await deployedToken.name();
  const symbol = await deployedToken.symbol();
  const totalSupplyResult = await deployedToken.totalSupply();
  const deployerBalance = await deployedToken.balanceOf(deployer.address);

  console.log("\nVerification:");
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Total Supply:", ethers.utils.formatEther(totalSupplyResult));
  console.log("Deployer Balance:", ethers.utils.formatEther(deployerBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
