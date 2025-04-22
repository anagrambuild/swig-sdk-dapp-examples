import { useState } from 'react';
import { Button, Tab, Tabs } from '@swig/ui';
import SwigDashboard from './SwigDashboard';

interface HomeProps {
  walletAddress?: string;
  onLogout: () => Promise<void>;
}

export const Home = ({ walletAddress, onLogout }: HomeProps) => {
  const [view, setView] = useState<'home' | 'swig'>('home');

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
      {view === 'swig' && <SwigDashboard walletAddress={walletAddress!} />}
    </div>
  );
};
