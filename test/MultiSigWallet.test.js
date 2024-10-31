const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSigWallet", function () {
  let multiSigWallet;
  let owners;
  let nonOwner;
  let recipient;

  beforeEach(async function () {
    [owner1, owner2, owner3, nonOwner, recipient] = await ethers.getSigners();
    owners = [owner1.address, owner2.address, owner3.address];
    const requiredConfirmations = 2;
    const thresholdAmount = ethers.parseEther("10");

    // Deploy MultiSigWallet
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    multiSigWallet = await MultiSigWallet.deploy(
      owners,
      requiredConfirmations,
      thresholdAmount
    );
    await multiSigWallet.waitForDeployment();

    // Fund the wallet with ETH
    await owner1.sendTransaction({
      to: multiSigWallet.target,
      value: ethers.parseEther("100"),
    });
  });

  it("Should submit a transaction successfully", async function () {
    const value = ethers.parseEther("20");
    const data = "0x";

    await expect(
      multiSigWallet
        .connect(owner1)
        .submitTransaction(recipient.address, value, data)
    ).to.emit(multiSigWallet, "TransactionCreated");

    const tx = await multiSigWallet.transactions(0);
    expect(tx.to).to.equal(recipient.address);
    expect(tx.value).to.equal(value);
    expect(tx.executed).to.be.false;
  });

  it("Should confirm and execute a transaction after required confirmations", async function () {
    const value = ethers.parseEther("20");
    const data = "0x";

    // Submit transaction
    await multiSigWallet
      .connect(owner1)
      .submitTransaction(recipient.address, value, data);

    // First confirmation
    await expect(
      multiSigWallet.connect(owner1).confirmTransaction(0)
    ).to.emit(multiSigWallet, "TransactionConfirmed");

    // Second confirmation (should execute after this)
    await expect(
      multiSigWallet.connect(owner2).confirmTransaction(0)
    ).to.emit(multiSigWallet, "TransactionExecuted");

    const tx = await multiSigWallet.transactions(0);
    expect(tx.executed).to.be.true;

    // Check recipient balance
  });

  it("Should not execute without enough confirmations", async function () {
    const value = ethers.parseEther("20");
    const data = "0x";

    await multiSigWallet
      .connect(owner1)
      .submitTransaction(recipient.address, value, data);

    // Only one confirmation
    await multiSigWallet.connect(owner1).confirmTransaction(0);

    const tx = await multiSigWallet.transactions(0);
    expect(tx.executed).to.be.false;

  });

  it("Should prevent non-owners from confirming", async function () {
    await multiSigWallet
      .connect(owner1)
      .submitTransaction(recipient.address, ethers.parseEther("20"), "0x");

    await expect(
      multiSigWallet.connect(nonOwner).confirmTransaction(0)
    ).to.be.revertedWith("Not owner");
  });
});
