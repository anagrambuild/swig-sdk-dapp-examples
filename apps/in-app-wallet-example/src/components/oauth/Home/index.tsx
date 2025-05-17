import React, { useEffect, useState } from 'react';
import { Tab, Tabs } from '@swig/ui';
import Defi from './Defi';
import SwigDashboard from './SwigDashboard';
import SwigTokenDemo from './SwigGasDemo';
import { SwigProvider } from '../../../context/SwigContext';
import DefiSecpPara from './DefiSecpPara';

interface HomeProps {
  walletAddress: string;
  walletType: 'SOLANA' | 'EVM';
  setWalletType: (type: 'SOLANA' | 'EVM') => void;
  onLogout: () => Promise<void>;
}

export const Home: React.FC<HomeProps> = ({
  walletAddress,
  walletType,
  setWalletType,
  onLogout,
}) => {
  const [view, setView] = useState<'home' | 'swig' | 'gas' | 'defisecp'>('home');

  // Load wallet type from localStorage on mount (optional safety in case parent didn’t already do it)
  useEffect(() => {
    const storedType = localStorage.getItem('walletType');
    if (storedType === 'SOLANA' || storedType === 'EVM') {
      setWalletType(storedType);
    }
  }, [setWalletType]);

  // Save to localStorage on user selection
  const handleWalletTypeChange = (type: 'SOLANA' | 'EVM') => {
    localStorage.setItem('walletType', type);
    setWalletType(type);
  };

  return (
    <SwigProvider walletAddress={walletAddress} walletType={walletType}>
      <div className='text-center flex flex-col gap-2 flex-grow w-full'>
        {/* Tabs + Wallet Type Selector */}
        <div className='flex flex-wrap justify-between items-center px-4'>
          <Tabs>
            <Tab isSelected={view === 'home'} onClick={() => setView('home')}>
              Home
            </Tab>
            <Tab isSelected={view === 'swig'} onClick={() => setView('swig')}>
              Swig Dashboard
            </Tab>
            <Tab isSelected={view === 'gas'} onClick={() => setView('gas')}>
              Swig Gas Demo
            </Tab>
            <Tab isSelected={view === 'defisecp'} onClick={() => setView('defisecp')}>
              Swig Dashboard EVM 
            </Tab>
          </Tabs>

          {/* Wallet Type Dropdown */}
          <div className='mt-2 sm:mt-0'>
            <label htmlFor='walletType' className='sr-only'>
              Wallet Type
            </label>
            <select
              id='walletType'
              value={walletType}
              onChange={(e) => handleWalletTypeChange(e.target.value as 'SOLANA' | 'EVM')}
              className='border border-gray-300 rounded p-1 text-sm'
            >
              <option value='SOLANA'>Solana Wallet</option>
              <option value='EVM'>EVM Wallet</option>
            </select>
          </div>
        </div>

        {/* View content */}
        {view === 'home' && <Defi walletAddress={walletAddress} onLogout={onLogout} />}
        {view === 'swig' && <SwigDashboard walletAddress={walletAddress} />}
        {view === 'gas' && <SwigTokenDemo /> } 
        {view === 'defisecp' && <DefiSecpPara walletAddress={walletAddress} onLogout={onLogout}/>}

        {/* Logout Button */}
      </div>
    </SwigProvider>
  );
};
