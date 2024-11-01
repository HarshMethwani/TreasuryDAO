import React, { useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import  IntentManagerAB from '../abi/IntentManager.json';

const IntentManagerABI = IntentManagerAB.abi;
function CreateIntentForm() {
  const { account, library, active } = useWeb3React();
  const [token, setToken] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startTime, setStartTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const INTENT_MANAGER_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Your IntentManager contract address

  async function handleCreateIntent(event) {
    event.preventDefault();
    if (!active || !account) {
      console.error('Wallet not connected');
      return;
    }
    setIsLoading(true);
    try {
      const signer = library.getSigner();
      const intentManager = new ethers.Contract(
        INTENT_MANAGER_ADDRESS,
        IntentManagerABI,
        signer
      );

      // Approve IntentManager to spend tokens
      const tokenContract = new ethers.Contract(
        token,
        ['function approve(address spender, uint256 amount) public returns (bool)'],
        signer
      );
      const approveTx = await tokenContract.approve(
        INTENT_MANAGER_ADDRESS,
        ethers.constants.MaxUint256
      );
      await approveTx.wait();

      // Create intent
      const createTx = await intentManager.createIntent(
        token,
        recipient,
        ethers.utils.parseUnits(amount, 18),
        frequency,
        startTime
      );
      await createTx.wait();
      console.log('Intent created successfully');
    } catch (error) {
      console.error('Error creating intent:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleCreateIntent}>
      <input
        type="text"
        placeholder="Token Address"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        disabled={isLoading}
      />
      <input
        type="text"
        placeholder="Recipient Address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        disabled={isLoading}
      />
      <input
        type="text"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={isLoading}
      />
      <input
        type="text"
        placeholder="Frequency (seconds)"
        value={frequency}
        onChange={(e) => setFrequency(e.target.value)}
        disabled={isLoading}
      />
      <input
        type="text"
        placeholder="Start Time (UNIX timestamp)"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        disabled={isLoading}
      />
      <button type="submit" disabled={!active || isLoading}>
        {isLoading ? 'Creating...' : 'Create Intent'}
      </button>
    </form>
  );
}

export default CreateIntentForm;
