import React, { useState } from 'react';
import InAppWalletSetup from './components/InAppWalletSetup';
import InAppWalletDetails from './components/InAppWalletDetails';
import InAppTransactionDemo from './components/InAppTransactionDemo';

const App: React.FC = () => {
  const [walletCreated, setWalletCreated] = useState(false);
  const [walletInfo, setWalletInfo] = useState<{
    publicKey: string;
    authMethod: string;
    walletType: string;
  } | null>(null);

  const handleWalletCreated = (info: {
    publicKey: string;
    authMethod: string;
    walletType: string;
  }) => {
    setWalletCreated(true);
    setWalletInfo(info);
  };

  const handleLogout = () => {
    setWalletCreated(false);
    setWalletInfo(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Swig In-App Wallet Example
          </h1>
          <p className="mt-2 text-gray-600">
            This demonstrates a dapp that creates a Swig wallet for users within the application
          </p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          {!walletCreated ? (
            <InAppWalletSetup onWalletCreated={handleWalletCreated} />
          ) : (
            <>
              {walletInfo && (
                <InAppWalletDetails
                  walletInfo={walletInfo}
                  onLogout={handleLogout}
                />
              )}
              
              <div className="mt-8">
                <InAppTransactionDemo
                  publicKey={walletInfo?.publicKey || ''}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
