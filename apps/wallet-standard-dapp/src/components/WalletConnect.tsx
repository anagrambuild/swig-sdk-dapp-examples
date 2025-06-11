import React, { useState } from 'react';
import { Button } from '@swig/ui';
import { useWallet } from '../contexts/WalletContext';

const WalletConnect: React.FC = () => {
  const {
    wallets,
    selectedWallet,
    publicKey,
    connecting,
    connected,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  const [showWalletList, setShowWalletList] = useState(false);

  const openSwigExtension = () => {
    const swigExtensionId = 'ngkjcjceookedgnmacgheeblecefegce';

    try {
      if (window.chrome && window.chrome.runtime) {
        window.chrome.runtime.sendMessage(swigExtensionId, {
          action: 'open_popup',
        });
        console.log('Extension open request sent');
      } else {
        throw new Error('Chrome extension API not available');
      }
    } catch (error) {
      console.error('Error opening extension:', error);
      window.open(`chrome-extension://${swigExtensionId}/index.html`, '_blank');
    }
  };

  const handleConnectClick = () => {
    setShowWalletList(!showWalletList);
  };

  const handleWalletSelect = async (wallet: any) => {
    try {
      await connectWallet(wallet);
      setShowWalletList(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 bg-white rounded-none">
      <h2 className="text-2xl font-semibold text-gray-900 text-center">Wallet Connection</h2>

      {!connected ? (
        <div className="space-y-4">
          <Button onClick={handleConnectClick} disabled={connecting} className="w-full">
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>

          {showWalletList && wallets && wallets.length > 0 && (
            <div className="w-full border border-gray-200 bg-gray-50 rounded p-4">
              <h3 className="text-lg font-medium mb-3 text-gray-800">Select a Wallet</h3>
              <ul className="space-y-2">
                {wallets.map((wallet, index) => (
                  <li key={wallet.adapter?.name || `wallet-${index}`}>
                    <button
                      className="w-full text-left px-4 py-2 rounded hover:bg-gray-100 flex items-center transition"
                      onClick={() => handleWalletSelect(wallet)}
                    >
                      {wallet.adapter?.icon && (
                        <img
                          src={wallet.adapter.icon}
                          alt={`${wallet.adapter.name} icon`}
                          className="w-5 h-5 mr-3"
                        />
                      )}
                      <span className="text-sm text-gray-800">
                        {wallet.adapter?.name || 'Unknown Wallet'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showWalletList && (!wallets || wallets.length === 0) && (
            <div className="w-full border border-gray-200 bg-gray-50 rounded p-4 text-sm text-gray-600">
              No compatible wallets found. Please install a Solana wallet extension that supports the Wallet Standard.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Connected:</span>{' '}
              <span className="font-mono text-xs break-all">{publicKey}</span>
            </div>
            <Button variant="secondary" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>

          {selectedWallet && (
            <div className="text-sm text-gray-600">
              Wallet: {selectedWallet.adapter?.name || 'Unknown Wallet'}
            </div>
          )}
        </div>
      )}

      <Button onClick={openSwigExtension} variant="secondary" className="w-full">
        Open Swig Extension
      </Button>
    </div>
  );
};

export default WalletConnect;
