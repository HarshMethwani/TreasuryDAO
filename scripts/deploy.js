// scripts/deploy.js

const { ethers } = require("hardhat");

async function main() {
  const [deployer1,deployer2,deployer3] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer1.address);
  const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

  const RELAYER_ADDRESS = deployer1.address; 
  const IntentManager = await ethers.getContractFactory("IntentManager");
  const intentManager = await IntentManager.deploy("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  await intentManager.waitForDeployment();
  console.log("IntentManager deployed to:", intentManager.target);

  const OWNERS = [deployer1.address,deployer2.address,deployer3.address]; 
  const REQUIRED_CONFIRMATIONS = 2;  
  const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
  const multiSigWallet = await MultiSigWallet.deploy(OWNERS, REQUIRED_CONFIRMATIONS,ethers.parseUnits("1000", 6));
  await multiSigWallet.waitForDeployment();
  console.log("MultiSigWallet deployed to:", multiSigWallet.target);

  const AcrossBridge = await ethers.getContractFactory("AcrossBridge");
  const acrossBridge = await AcrossBridge.deploy("0xCfc0a994eF8a4576115d9Ff4C8dF5b5a8eC5dA3f");
  await acrossBridge.waitForDeployment();
  console.log("AcrossBridge deployed to:", acrossBridge.target);
}



main()
  .then(() => {
    console.log("Deployment finished successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
