import React from 'react';
import { WalletProvider } from './contexts/WalletContext';
import NavbarWallet from './components/WalletConnect';
import TransactionDemo from './components/TransactionDemo';

const App: React.FC = () => {
  return (
    <WalletProvider>
      <div className='min-h-screen bg-gray-100'>
        <header className='bg-white shadow'>
          <div className='max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
            <div className="flex items-center justify-between">
              <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
                Swig Wallet Standard Dapp
              </h1>
              <NavbarWallet />
            </div>
          </div>
        </header>
        <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
          <div className='bg-white shadow overflow-hidden sm:rounded-lg p-6'>
            <TransactionDemo />
          </div>
        </main>
      </div>
    </WalletProvider>
  );
};

export default App;