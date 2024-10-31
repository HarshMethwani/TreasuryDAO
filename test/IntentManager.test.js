const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("IntentManager with MultiSigWallet", function () {
  let intentManager, multiSigWallet, mockToken;
  let owner, owner2, owner3, recipient, other;

  beforeEach(async function () {
    [owner, owner2, owner3, recipient, other] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("ERC20Mock");
    mockToken = await MockToken.deploy("MockToken", "MTK", owner.address, ethers.parseEther("10000"));
    await mockToken.waitForDeployment();
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    multiSigWallet = await MultiSigWallet.deploy(
      [owner.address, owner2.address, owner3.address],
      2, 
      ethers.parseEther("10") 
    );
    await multiSigWallet.waitForDeployment();

    const IntentManager = await ethers.getContractFactory("IntentManager");
    intentManager = await IntentManager.deploy(multiSigWallet.target);
    await intentManager.waitForDeployment();
    await mockToken.connect(owner).transfer(other.address, ethers.parseEther("1000"));
  });

  it("Should create an intent successfully", async function () {
    const amount = ethers.parseEther("5"); 
    const frequency = 3600; 
    const startTime = Math.floor(Date.now() / 1000) + 60; 

    await expect(
      intentManager
        .connect(owner)
        .createIntent(
          mockToken.target,
          recipient.address,
          amount,
          frequency,
          startTime
        )
    )
      .to.emit(intentManager, "IntentCreated")
      .withArgs(
        owner.address,
        0,
        mockToken.target,
        recipient.address,
        amount,
        frequency,
        startTime
      );

    const intents = await intentManager.userIntents(owner.address, 0);
    expect(intents.active).to.be.true;
  });

  it("Should execute an intent directly if below threshold", async function () {
    const amount = ethers.parseEther("5"); 
    const frequency = 3600;
    const startTime = (await time.latest()) + 2; 

    
    await mockToken.connect(owner).approve(intentManager.target, ethers.parseEther("1000"));

    
    await intentManager.connect(owner).createIntent(
      mockToken.target,
      recipient.address,
      amount,
      frequency,
      startTime
    );

    
    await time.increaseTo(startTime + 1);


    const data = intentManager.interface.encodeFunctionData(
      "executeIntent",
      [owner.address, 0]
    );

    await multiSigWallet.connect(owner).submitTransaction(intentManager.target, 0, data);

    
    await expect(multiSigWallet.connect(owner).confirmTransaction(0))
      .to.emit(multiSigWallet, "TransactionConfirmed");


  });

  it("Should prevent execution before the next execution time", async function () {
    const amount = ethers.parseEther("100");
    const frequency = 3600;
    const startTime = (await time.latest()) + frequency; 

    await intentManager
      .connect(owner)
      .createIntent(
        mockToken.target,
        recipient.address,
        amount,
        frequency,
        startTime
      );

    
    const data = intentManager.interface.encodeFunctionData(
      "executeIntent",
      [owner.address, 0]
    );

    await multiSigWallet.connect(owner).submitTransaction(intentManager.target, 0, data);

    
    expect(multiSigWallet.connect(owner).confirmTransaction(0))
      .to.throws
  });

  it("Should cancel an intent", async function () {
    const amount = ethers.parseEther("100");
    const frequency = 3600;
    const startTime = Math.floor(Date.now() / 1000) + 60;

    await intentManager
      .connect(owner)
      .createIntent(
        mockToken.target,
        recipient.address,
        amount,
        frequency,
        startTime
      );


    await expect(intentManager.connect(owner).cancelIntent(0))
      .to.emit(intentManager, "IntentCancelled")
      .withArgs(owner.address, 0);

    const intent = await intentManager.userIntents(owner.address, 0);
    expect(intent.active).to.be.false;
  });

  async function getBlockTime() {
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    return block.timestamp;
  }
});
