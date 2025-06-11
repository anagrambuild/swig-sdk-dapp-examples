import React, { useState } from 'react';
import { Button } from '@swig/ui';
import { useWallet } from '../contexts/WalletContext';

const NavbarWallet: React.FC = () => {
  const {
    wallets,
    selectedWallet,
    publicKey,
    connecting,
    connected,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showConnectedDropdown, setShowConnectedDropdown] = useState(false);

  const handleConnectClick = () => {
    setShowWalletDropdown(!showWalletDropdown);
  };

  const handleWalletSelect = async (wallet: any) => {
    try {
      await connectWallet(wallet);
      setShowWalletDropdown(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowWalletDropdown(false);
    setShowConnectedDropdown(false);
  };

  const truncateAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="relative flex items-center space-x-3">
      {!connected ? (
        <>
          <div className="relative">
            <Button 
              onClick={handleConnectClick} 
              disabled={connecting}
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>

            {showWalletDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Select a Wallet</h3>
                  
                  {wallets && wallets.length > 0 ? (
                    <ul className="space-y-2">
                      {wallets.map((wallet, index) => (
                        <li key={wallet.adapter?.name || `wallet-${index}`}>
                          <button
                            className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center transition text-sm"
                            onClick={() => handleWalletSelect(wallet)}
                          >
                            {wallet.adapter?.icon && (
                              <img
                                src={wallet.adapter.icon}
                                alt={`${wallet.adapter.name} icon`}
                                className="w-4 h-4 mr-3"
                              />
                            )}
                            <span className="text-gray-800">
                              {wallet.adapter?.name || 'Unknown Wallet'}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-600 py-2">
                      No compatible wallets found. Please install a Solana wallet extension.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="relative">
          <div 
            className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50 transition"
            onClick={() => setShowConnectedDropdown(!showConnectedDropdown)}
          >
            <div className="text-sm text-gray-700">
              <span className="hidden sm:inline font-medium">Connected: </span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {truncateAddress(publicKey)}
              </span>
            </div>
            
            {selectedWallet && (
              <div className="hidden md:flex items-center text-xs text-gray-500">
                {selectedWallet.adapter?.icon && (
                  <img
                    src={selectedWallet.adapter.icon}
                    alt={`${selectedWallet.adapter.name} icon`}
                    className="w-4 h-4 mr-1"
                  />
                )}
                {selectedWallet.adapter?.name}
              </div>
            )}
            
            <svg 
              className={`w-4 h-4 text-gray-500 transition-transform ${showConnectedDropdown ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {showConnectedDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="py-2">
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition"
                >
                  <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Disconnect Wallet
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {(showWalletDropdown || showConnectedDropdown) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowWalletDropdown(false);
            setShowConnectedDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default NavbarWallet;
