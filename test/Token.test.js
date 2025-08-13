const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CustomToken", function () {
  let CustomToken;
  let customToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    CustomToken = await ethers.getContractFactory("CustomToken");
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy a new CustomToken contract before each test.
    customToken = await CustomToken.deploy(
      "Test Token",
      "TEST",
      1000000,
      18
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await customToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await customToken.balanceOf(owner.address);
      expect(await customToken.totalSupply()).to.equal(ownerBalance);
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
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      await customToken.transfer(addr1.address, 50);
      const addr1Balance = await customToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2
      await customToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await customToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await customToken.balanceOf(owner.address);
      
      // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens).
      await expect(
        customToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      // Owner balance shouldn't have changed.
      expect(await customToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const initialBalance = await customToken.balanceOf(addr1.address);
      await customToken.mint(addr1.address, 100);
      const finalBalance = await customToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance.add(100));
    });

    it("Should fail if non-owner tries to mint", async function () {
      await expect(
        customToken.connect(addr1).mint(addr2.address, 100)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their own tokens", async function () {
      // First transfer some tokens to addr1
      await customToken.transfer(addr1.address, 100);
      const initialBalance = await customToken.balanceOf(addr1.address);
      
      // Then burn some tokens
      await customToken.connect(addr1).burn(50);
      const finalBalance = await customToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance.sub(50));
    });

    it("Should fail if user tries to burn more tokens than they have", async function () {
      await expect(
        customToken.connect(addr1).burn(100)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });
});
