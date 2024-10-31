const { expect } = require("chai");
const { ethers } = require("hardhat");
const Permit2ABI = require("./Permit2.json");
describe("GaslessTransfer", function () {
  let gaslessTransfer;
  let mockToken;
  let permit2;
  let owner;
  let relayer;
  let recipient;
  let other;

  beforeEach(async function () {
    [owner, relayer, recipient, other] = await ethers.getSigners();

    // Deploy MockToken (ERC20)
    const MockToken = await ethers.getContractFactory("ERC20Mock");
    mockToken = await MockToken.deploy("MockToken", "MTK", owner.address,ethers.parseEther("10000"));
    await mockToken.waitForDeployment();

    // Deploy MockPermit2 (for testing purposes)
    const MockPermit2 = new ethers.ContractFactory(Permit2ABI.abi, Permit2ABI.bytecode, owner);
    permit2 = await MockPermit2.deploy();
    await permit2.waitForDeployment();
    console.log(permit2.target)
    // Deploy GaslessTransfer contract
    const GaslessTransfer = await ethers.getContractFactory("GaslessTransfer");
    gaslessTransfer = await GaslessTransfer.deploy(permit2.target, relayer.address);
    await gaslessTransfer.waitForDeployment();
  });

  it("Should execute a gasless transfer successfully", async function () {
    const amount = ethers.parseEther("10");
    const nonce = 0;
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    // Owner approves permit2 to spend tokens (simulate permit signature)
    await mockToken.connect(owner).approve(permit2.target , amount);

    // Simulate EIP-712 signature (for testing, we bypass actual signature)

    const domain = {
      name: 'Permit2',
      version: '1',
      chainId: 1, // Hardhat Network chain ID
      verifyingContract: permit2.target,
    };
    
    const types = {
      PermitTransferFrom: [
        { name: 'permitted', type: 'TokenPermissions' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
      TokenPermissions: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
    };
    
    const value = {
      permitted: {
        token: mockToken.target,
        amount: amount.toString(),
      },
      nonce: nonce,
      deadline: deadline,
    };
    
    // Sign the permit
    const signature = await owner.signTypedData(domain, types, value);
    

    // Relayer calls gaslessTransfer
    await expect(
      gaslessTransfer
        .connect(relayer)
        .gaslessTransfer(
          mockToken.target,
          amount,
          nonce,
          deadline,
          signature,
          recipient.address
        )
    )
      .to.emit(gaslessTransfer, "GaslessTransferExecuted")
      .withArgs(relayer.address, recipient.address, mockToken.target, amount);
    // Check recipient balance
    const recipientBalance = await mockToken.balanceOf(recipient.address);
    expect(recipientBalance).to.equal(amount);
  });

  it("Should fail if called by someone other than the relayer", async function () {
    const amount = ethers.utils.parseEther("10");
    const nonce = 1;
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const signature = "0x";


    
    await expect(
      gaslessTransfer
        .connect(other)
        .gaslessTransfer(
          mockToken.address,
          amount,
          nonce,
          deadline,
          signature,
          recipient.address
        )
    ).to.be.revertedWith("Only relayer can execute gasless transfers");
  });

  it("Should update the relayer correctly", async function () {
    // Assuming the owner can update the relayer
    await gaslessTransfer.connect(owner).updateRelayer(other.address);

    const newRelayer = await gaslessTransfer.relayer();
    expect(newRelayer).to.equal(other.address);
  });

  it("Should fail if the signature is invalid", async function () {
    const amount = ethers.utils.parseEther("10");
    const nonce = 0;
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const signature = "0x";

    // Relayer calls gaslessTransfer with invalid signature
    await expect(
      gaslessTransfer
        .connect(relayer)
        .gaslessTransfer(
          mockToken.address,
          amount,
          nonce,
          deadline,
          signature,
          recipient.address
        )
    ).to.be.revertedWith("Invalid permit");
  });
});
