import { Button, Tab, Tabs } from '@swig/ui';
import { Connection, PublicKey } from '@solana/web3.js';
import { createSwigAccount } from '../../../utils/createSwigAccount';
import { useState } from 'react';
import { fetchSwig } from '@swig-wallet/classic';
import SwigDashboard from './SwigDashboard';

interface HomeProps {
  walletAddress?: string;
  onLogout: () => Promise<void>;
}

export const Home = ({ walletAddress, onLogout }: HomeProps) => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [swigAddress, setSwigAddress] = useState<string | null>(null);
  const [swigRoles, setSwigRoles] = useState<string[]>([]);
  const [view, setView] = useState<'home' | 'swig'>('home');

  const handleSetupSwigWallet = async () => {
    try {
      setIsSettingUp(true);
      const connection = new Connection('http://localhost:8899', 'confirmed');
      const { swigAddress } = await createSwigAccount(connection);
      setSwigAddress(swigAddress.toBase58());
    } catch (error) {
      console.error('Failed to set up Swig wallet:', error);
    } finally {
      setIsSettingUp(false);
    }
  };

  const getSwigRoles = async () => {
    if (!swigAddress) return [];
    const connection = new Connection('http://localhost:8899', 'confirmed');
    const swig = await fetchSwig(connection, new PublicKey(swigAddress));
    console.log(swig.roles);
    return swig.roles;
  };

  return (
    <div className='text-center flex flex-col gap-2 flex-grow w-full'>
      <Tabs>
        <Tab isSelected={view === 'home'} onClick={() => setView('home')}>
          Home
        </Tab>
        <Tab isSelected={view === 'swig'} onClick={() => setView('swig')}>
          Swig Dashboard
        </Tab>
      </Tabs>
      {view === 'home' && (
        <div className='flex flex-col gap-2 justify-between flex-grow'>
          <div className='flex flex-col gap-4 justify-center'>
            <h2 className='text-xl font-bold'>You are logged in!</h2>
            {walletAddress ? (
              <div className='flex flex-col gap-2'>
                <p>
                  Your first wallet address is: <strong>{walletAddress}</strong>
                </p>
                {swigAddress && (
                  <p>
                    Your Swig wallet address is: <strong>{swigAddress}</strong>
                  </p>
                )}
                <div className='flex flex-col gap-2 justify-center w-[50%] mx-auto'>
                  <Button
                    onClick={handleSetupSwigWallet}
                    disabled={isSettingUp || !!swigAddress}
                  >
                    {isSettingUp ? 'Setting up...' : 'Set up Swig wallet'}
                  </Button>
                  {swigAddress && (
                    <Button variant='secondary' onClick={getSwigRoles}>
                      Get Swig roles
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p>No wallet found.</p>
            )}
          </div>
          <div className='flex flex-col gap-2 justify-center w-[50%] mx-auto'>
            <Button variant='secondary' onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      )}
      {view === 'swig' && <SwigDashboard />}
    </div>
  );
};
