# Treasury DAO Dapp

## How to build
- Clone both the branch on local
- Then Clone the permit2 repository as they don't have a npm sdk for contracts,
- ```mkdir lib```   ```cd lib```  ```git clone https://github.com/Uniswap/permit2.git```
- Install all Packages ```npm install```
- Compile the Contracts ```npx hardhat compile```
- Run the tests ```npx hardhat test```

```Note: All contracts address are directly presented in frontend deployed on Sepolia ETH ```

### Build the Frontend:
- ```npm install``` then ```npm start```

# Dependencies

The suite leverages:

- Chai for assertions.
- Hardhat for Ethereum smart contract deployment and testing.
- Ethers.js for blockchain interaction.
- Permit2 SDK for constructing permit data required for the EIP-712 signatures.
- Web3Modal for frontend wallet integration

# Contracts:
  - GaslessTransfer.sol
  - IntentManager.sol
  - AcrossBridge.sol
  - MultiSignWallet.sol

# Tests:
## GaslessTransfer.sol
- This Contracts helps in signing and transferring the amount.
- The User can set a ```amountAllowed``` and the amount he want's to transfer ```amountTransfer```
- Though the transaction are not completely gasless ( because of gas involved in signature and approval of tokens) but if would user if he want's to request multiple transaction with ```amountTransfer<amountAllowed && block.timestamp()<=deadlineTime```
- I have integrated the contract with the frontend for testing via directly metmask on the Sepolia Eth Chain.

## IntentManager.sol
  - **Create Intent**: Help's create a intent with the frequency, amount, token, startTime
  - **Execute Intent**:
    - **Below Threshold**: If the transaction is above Threshold it gets automatically executed.
    - **Above Threshold**: If the transaction if above threshold the MultiSignWallet comes into picture.
   - **Cancel Intent**: If the owner request to cancel the intent it will be deleted
   - **Prevents execution Before the next execution**

## MultiSignWallet.sol
(Note: In this script there will be 3 signers )

**submitTransaction**
-
 - Allows an owner to submit a transaction.
 - Creates a new transaction and stores it in the transactions mapping.
 - Emits a ```TransactionCreated``` event.

**confirmTransaction**
 - 
  - Allows an owner to confirm a transaction if they haven’t done so already.
  - Updates the confirmations count for the transaction.
  - Emits a TransactionConfirmed event.

# Frontend Requirements 
- Connecting the wallet
- Sign and transfer the permit
- Create Intents using Intent Manager
- https://treasury-61ap451bo-harshmethwanis-projects.vercel.app/
