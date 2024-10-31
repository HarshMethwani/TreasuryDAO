// src/hooks/useContract.js
import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import GaslessTransferABI from '../abi/GaslessTransfer.json';

export function useContract(address, ABI) {
  const { library, account } = useWeb3React();

  return useMemo(() => {
    if (!address || !ABI || !library) return null;
    try {
      return new ethers.Contract(address, ABI, library.getSigner(account));
    } catch (error) {
      console.error('Failed to get contract', error);
      return null;
    }
  }, [address, ABI, library, account]);
}
