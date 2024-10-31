const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AcrossBridge", function () {
  let acrossBridge;
  let mockToken;
  let mockAcross;
  let owner;
  let recipient;

  beforeEach(async function () {
    [owner, recipient] = await ethers.getSigners();
    const MockToken = await ethers.getContractFactory("ERC20Mock");
    mockToken = await MockToken.deploy("MockToken", "MTK", owner.address,ethers.parseEther("10000"));
    await mockToken.waitForDeployment();

    const MockAcrossBridge = await ethers.getContractFactory("MockAcrossBridge");
    mockAcross = await MockAcrossBridge.deploy();
    await mockAcross.waitForDeployment();

    const AcrossBridge = await ethers.getContractFactory("AcrossBridge");
    acrossBridge = await AcrossBridge.deploy(mockAcross.target);
    await acrossBridge.waitForDeployment();
  });

  it("Should initiate a bridge transfer successfully", async function () {
    const amount = ethers.parseEther("50");
    const destinationChainId = 420; 
    await mockToken.connect(owner).approve(acrossBridge.target, amount);
    await expect(
      acrossBridge
        .connect(owner)
        .bridgeTokens(
          mockToken.target,
          amount,
          recipient.address,
          destinationChainId,
          { value: ethers.parseEther("0.01") } 
        )
    )
      .to.emit(acrossBridge, "BridgeInitiated")
      .withArgs(owner.address, mockToken.target, amount, destinationChainId);

    const acrossBalance = await mockToken.balanceOf(mockAcross.target);
    expect(acrossBalance).to.equal(amount);
  });

  it("Should fail if the token transfer fails", async function () {
    const amount = ethers.parseEther("10000000000000");
    const destinationChainId = 420;

    await mockToken.connect(owner).approve(acrossBridge.target, amount);

    await expect(
      acrossBridge
        .connect(owner)
        .bridgeTokens(
          mockToken.target,
          amount,
          recipient.address,
          destinationChainId,
          { value: ethers.parseEther("0.01") }
        )
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });
});
