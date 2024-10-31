require("@nomicfoundation/hardhat-toolbox");
// require("@nomiclabs/hardhat-ethers");
require("dotenv").config();  // For environment variables (recommended)

const API_URL =   "https://eth-sepolia.g.alchemy.com/v2/kv-uxlax45ii9UOip8HkaEagrOs7cKlQ"; 
const PRIVATE_KEY1 = "c2f44250fe15b6cc679a68c1d3899241a76bb2445cc1034b189b70f624caf671";  // Replace with your private key
const PRIVATE_KEY2 = "e9d57598b0b5241580a54820b90452235f2337f0b3e8efa0f1a71638897ba5f0"
const PRIVATE_KEY3 = "9ccd3775cda7b5c5e68c930ce576fe44e32fe71251507f2cd19b337c8d55bdde"
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
      },


    },
  },
  networks: {
    hardhat: {

    },
    sepolia: {
      url: API_URL,
      accounts: [PRIVATE_KEY1,PRIVATE_KEY2,PRIVATE_KEY3],  
    },
  },
};