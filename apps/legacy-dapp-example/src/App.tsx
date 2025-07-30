import React, { useState } from 'react';
import { SolanaProvider } from './components/SolanaProvider';
import LegacyWalletConnect from './components/LegacyWalletConnect';
import LegacyTransactionDemo from './components/LegacyTransactionDemo';

const AppContent: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Swig Legacy Dapp Example
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <LegacyWalletConnect 
            onConnect={(pubkey) => {
              setConnected(true);
              setPublicKey(pubkey);
            }}
            onDisconnect={() => {
              setConnected(false);
              setPublicKey(null);
            }}
          />

          {connected && publicKey && (
            <div className="mt-8">
              <h2 className="text-xl font-medium text-gray-900">Connected Account</h2>
              <p className="mt-2 text-sm text-gray-600 break-all">{publicKey}</p>

              <div className="mt-8">
                <LegacyTransactionDemo publicKey={publicKey} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <SolanaProvider>
    <AppContent />
  </SolanaProvider>
);

export default App;
