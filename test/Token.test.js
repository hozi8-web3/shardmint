const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CustomToken", function () {
  let CustomToken;
  let customToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    CustomToken = await ethers.getContractFactory("CustomToken");
    [owner, addr1, addr2] = await ethers.getSigners();

    const totalSupply = ethers.parseEther("1000000"); // 1M tokens
    const maxSupply = ethers.parseEther("10000000");  // 10M tokens max
    const logoUrl = "https://example.com/logo.png";
    const description = "This is a test token.";

    customToken = await CustomToken.deploy(
      "Test Token",     // name
      "TEST",           // symbol
      18,               // decimals
      totalSupply,      // initialSupply
      maxSupply,        // maxSupply
      logoUrl,          // logoUrl
      description       // description
    );
  });

  describe("Deployment", function () {
    it("Should assign the total supply of tokens to the deployer", async function () {
      const deployerBalance = await customToken.balanceOf(owner.address);
      expect(await customToken.totalSupply()).to.equal(deployerBalance);
    });

    it("Should set the correct token name", async function () {
      expect(await customToken.name()).to.equal("Test Token");
    });

    it("Should set the correct token symbol", async function () {
      expect(await customToken.symbol()).to.equal("TEST");
    });

    it("Should set the correct decimals", async function () {
      expect(await customToken.decimals()).to.equal(18);
    });

    it("Should have the correct total supply in human readable format", async function () {
      const totalSupply = await customToken.totalSupply();
      const formattedSupply = ethers.formatEther(totalSupply);
      expect(formattedSupply).to.equal("1000000.0");
    });

    it("Should return the correct logo URL", async function () {
      expect(await customToken.logoUrl()).to.equal("https://example.com/logo.png");
    });

    it("Should return the correct description", async function () {
      expect(await customToken.description()).to.equal("This is a test token.");
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("50");
      await customToken.transfer(addr1.address, transferAmount);
      const addr1Balance = await customToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);

      await customToken.connect(addr1).transfer(addr2.address, transferAmount);
      const addr2Balance = await customToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await customToken.balanceOf(owner.address);

      const transferAmount = ethers.parseEther("1");
      await expect(
        customToken.connect(addr1).transfer(owner.address, transferAmount)
      ).to.be.reverted(); // Just check revert, no string reason

      expect(await customToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Minting", function () {
    it("Should allow anyone to mint tokens", async function () {
      const initialBalance = await customToken.balanceOf(addr1.address);
      const mintAmount = ethers.parseEther("100");
      await customToken.mint(addr1.address, mintAmount);
      const finalBalance = await customToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance + mintAmount);
    });
  });
});
