const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LearnToken", function () {
  let token;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const LearnToken = await ethers.getContractFactory("LearnToken");
    token = await LearnToken.deploy();
  });

  it("Should have correct initial supply", async function () {
    const totalSupply = await token.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther("1000000"));
  });

  it("Should assign initial balance to owner", async function () {
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("1000000"));
  });

  it("Should transfer tokens between accounts", async function () {
    // Transfer 100 tokens from owner to addr1
    await token.transfer(addr1.address, ethers.parseEther("100"));
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseEther("100"));
    
    // Transfer 50 tokens from addr1 to addr2
    await token.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
    const addr2Balance = await token.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.parseEther("50"));
  });

  it("Should fail if sender doesn't have enough tokens", async function () {
    const initialOwnerBalance = await token.balanceOf(owner.address);
    
    // Try to send 1 token from addr1 (0 tokens) to owner (should fail)
    await expect(
      token.connect(addr1).transfer(owner.address, 1)
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    
    // Owner balance shouldn't have changed
    expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance);
  });

  it("Should update allowances", async function () {
    await token.approve(addr1.address, ethers.parseEther("100"));
    const allowance = await token.allowance(owner.address, addr1.address);
    expect(allowance).to.equal(ethers.parseEther("100"));
  });

  it("Should allow transferFrom with sufficient allowance", async function () {
    await token.approve(addr1.address, ethers.parseEther("100"));
    
    // Transfer 50 tokens from owner to addr2 using addr1
    await token.connect(addr1).transferFrom(
      owner.address, 
      addr2.address, 
      ethers.parseEther("50")
    );
    
    expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    expect(await token.allowance(owner.address, addr1.address)).to.equal(ethers.parseEther("50"));
  });

  it("Should fail transferFrom with insufficient allowance", async function () {
    await token.approve(addr1.address, ethers.parseEther("50"));
    
    // Try to transfer 100 tokens (should fail)
    await expect(
      token.connect(addr1).transferFrom(
        owner.address, 
        addr2.address, 
        ethers.parseEther("100")
      )
    ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
  });

  it("Should allow minting by owner", async function () {
    await token.mint(addr1.address, ethers.parseEther("200"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("200"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000200"));
  });

  it("Should prevent minting by non-owner", async function () {
    await expect(
      token.connect(addr1).mint(addr1.address, ethers.parseEther("100"))
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
  });

  it("Should allow burning tokens", async function () {
    const initialSupply = await token.totalSupply();
    const initialBalance = await token.balanceOf(owner.address);
    
    await token.burn(owner.address, ethers.parseEther("100"));
    
    expect(await token.totalSupply()).to.equal(initialSupply - ethers.parseEther("100"));
    expect(await token.balanceOf(owner.address)).to.equal(initialBalance - ethers.parseEther("100"));
  });
});

describe("TokenSale", function () {
  let token, tokenSale;
  let owner, buyer;

  beforeEach(async function () {
    [owner, buyer] = await ethers.getSigners();
    
    const LearnToken = await ethers.getContractFactory("LearnToken");
    token = await LearnToken.deploy();
    
    const TokenSale = await ethers.getContractFactory("TokenSale");
    tokenSale = await TokenSale.deploy(token.target);
    
    // Transfer 10000 tokens to token sale contract
    await token.transfer(tokenSale.target, ethers.parseEther("10000"));
  });

  it("Should allow buying tokens with ETH", async function () {
    const initialTokenBalance = await token.balanceOf(buyer.address);
    
    // Buy tokens with 1 ETH (应该得到 100 个代币)
    await tokenSale.connect(buyer).buyTokens({
      value: ethers.parseEther("1")
    });
    
    const newTokenBalance = await token.balanceOf(buyer.address);
    expect(newTokenBalance).to.equal(initialTokenBalance + ethers.parseEther("100")); // 1 ETH = 100 tokens
  });

  it("Should prevent buying when insufficient tokens", async function () {
    // Try to buy more tokens than available (10000 tokens available, try to buy with 101 ETH = 10100 tokens)
    await expect(
      tokenSale.connect(buyer).buyTokens({
        value: ethers.parseEther("101") // 101 ETH = 10100 tokens, 超过可用的10000代币
      })
    ).to.be.revertedWith("Not enough tokens in the contract");
  });

  it("Should allow owner to withdraw ETH", async function () {
    // Buy tokens first
    await tokenSale.connect(buyer).buyTokens({
      value: ethers.parseEther("1")
    });
    
    const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
    
    // Withdraw ETH
    const tx = await tokenSale.withdrawEth();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    
    const newOwnerBalance = await ethers.provider.getBalance(owner.address);
    expect(newOwnerBalance).to.equal(
      initialOwnerBalance + ethers.parseEther("1") - gasUsed
    );
  });

  it("Should prevent non-owner from withdrawing ETH", async function () {
    await expect(
      tokenSale.connect(buyer).withdrawEth()
    ).to.be.revertedWithCustomError(tokenSale, "OwnableUnauthorizedAccount");
  });
});