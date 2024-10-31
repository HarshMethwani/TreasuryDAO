import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../connector.js';

export default function WalletConnect() {
  const { active, account, activate, deactivate } = useWeb3React();

  const connect = async () => {
    try {
      await activate(injected);
      console.log('Connected');
    } catch (ex) {
      console.error(ex);
    }
  };

  const disconnect = async () => {
    try {
      deactivate();
      console.log('Disconnected');
    } catch (ex) {
      console.error(ex);
    }
  };

  return (
    <div>
      {active ? (
        <div>
          <button onClick={disconnect}>Disconnect Wallet</button>
          <p>Connected with <b>{account}</b></p>
        </div>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
