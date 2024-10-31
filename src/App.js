import React from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { ethers } from 'ethers';
import GaslessTransferForm from './components/GaslessTransferForm';
import WalletConnect from './components/WalletConnect';
import CreateIntentForm from './components/createIntent';

function getLibrary(provider) {
  return new ethers.providers.Web3Provider(provider);
}

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <WalletConnect />
      <GaslessTransferForm />
      <CreateIntentForm />
    </Web3ReactProvider>
  );
}

export default App;
