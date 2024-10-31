import React, { useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { SignatureTransfer, PERMIT2_ADDRESS, permit2Address } from '@uniswap/permit2-sdk';

function GaslessTransferForm() {
  const GASLESS_TRANSFER_ADDRESS = '0xD83275b5C14B57645aE397d2A8f2971c01acd45D'; // Contract Address
  const TOKEN_ADDRESS = '0x3eb159De6c44fCC8eF3EEF483a8de7A426B6f3E2';       // Token Address

  const { account, library, active } = useWeb3React();
  const [tokenAddress, setTokenAddress] = useState(TOKEN_ADDRESS);
  const [amountAllowed, setAmountAllowed] = useState('');
  const [amountTransfer, setAmountTransfer] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // Automatically approve the token if needed
  useEffect(() => {
    if (!active || !account) return;

    async function checkAndApproveToken() {
      const signer = library.getSigner();
      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESS,
        [
          'function approve(address spender, uint256 amount) public returns (bool)',
          'function allowance(address owner, address spender) view returns (uint256)',
        ],
        signer
      );

        // Approve max allowance
          try{
            const allowance = await tokenContract.allowance(account, PERMIT2_ADDRESS);
            if(allowance>0){
              console.log('Token already approved');
              return;
            }
            const tx = await tokenContract.approve(PERMIT2_ADDRESS, ethers.constants.MaxUint256);
            await tx.wait();
            console.log('Token approval successful');
          } catch (error) {
            console.error('Token approval error:', error);
            setIsApproved(false);
          }
    }

    setIsApproved(true);
    checkAndApproveToken();
  }, [active, account, library]);

  // Sign the permit data for gasless transfer
  async function signPermit(tokenAddress, amountAllowed, nonce, deadline, chainId) {
    if (!isApproved) {
      console.error('Token not approved');
      return;
    }

    const signer = library.getSigner();
    const permit = {
      permitted: { token: tokenAddress, amount: amountAllowed },
      spender: GASLESS_TRANSFER_ADDRESS,
      nonce,
      deadline,
    };
    console.log("Account: ", account);
    const { domain, types, values } = SignatureTransfer.getPermitData(
      permit,
      PERMIT2_ADDRESS,
      chainId
    );
    const signature = await signer._signTypedData(domain, types, values);
    return signature;
  }

  // Execute the gasless transfer directly from the frontend
  async function executeGaslessTransfer(event) {
    event.preventDefault();
    if (!active || !account) {
      console.error('Wallet not connected');
      return;
    }

    setIsLoading(true);

    try {
      const transferAmount = ethers.utils.parseUnits(amountAllowed, 18);
      const nonce = await library.getTransactionCount(account);
      // const nonce = await signer.getTransactionCount(); // Simplified; use proper nonce management in production
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const chainId = 11155111;

      // Sign the permit
      const signature = await signPermit(
        TOKEN_ADDRESS,
        transferAmount,
        nonce,
        deadline,
        chainId
      );

      // Connect to the GaslessTransfer contract
      const signer = library.getSigner();
      const contract = new ethers.Contract(
        GASLESS_TRANSFER_ADDRESS,
        [
          'function gaslessTransfer(address token, uint256 amountAllowed, uint256 amountTransfer, uint256 nonce, uint256 deadline, bytes signature, address recipient) external',
        ],
        signer
      );

      // Call the gaslessTransfer function directly
      const tx = await contract.gaslessTransfer(
        tokenAddress,
        ethers.utils.parseUnits(amountAllowed, 18),
        ethers.utils.parseUnits(amountTransfer, 18),
        nonce,
        deadline,
        signature,
        recipient,
        { gasLimit: 300000 }
      );
      await tx.wait();
      console.log('Gasless transfer executed successfully');
      console.log('Transaction Hash:', tx.hash);
    } catch (error) {
      console.error('Error executing gasless transfer:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={executeGaslessTransfer}>
      <input
        type="text"
        placeholder="Token Address"
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        disabled={isLoading}
      />
      <input
        type="text"
        placeholder="Allowed Amount"
        value={amountAllowed}
        onChange={(e) => setAmountAllowed(e.target.value)}
        disabled={isLoading}
      />
      <input
        type="text"
        placeholder="Transfer Amount"
        value={amountTransfer}
        onChange={(e) => setAmountTransfer(e.target.value)}
        disabled={isLoading}
      />
      <input
        type="text"
        placeholder="Recipient Address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        disabled={isLoading}
      />
      <button type="submit" disabled={!active || isLoading || !isApproved}>
        {isLoading ? 'Processing...' : active ? 'Sign and Transfer' : 'Connect Wallet'}
      </button>
      {isLoading && <p>Transaction is processing, please wait...</p>}
    </form>
  );
}

export default GaslessTransferForm;
