import { useEffect, useState } from 'react';
import { WalletDisplay } from './WalletDisplay';
import { para } from '../../client/para';
import { ParaModal } from '@getpara/react-sdk';
import { Button } from '@swig/ui';
import '@getpara/react-sdk/styles.css';

const ParaOAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [wallet, setWallet] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCheckIfAuthenticated = async () => {
    setIsLoading(true);
    setError('');
    try {
      const isAuthenticated = await para.isFullyLoggedIn();
      setIsConnected(isAuthenticated);
      if (isAuthenticated) {
        const wallets = Object.values(await para.getWallets());
        if (wallets?.length) {
          setWallet(wallets[0].address || 'unknown');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    handleCheckIfAuthenticated();
  }, []);

  const handleLogout = async () => {
    try {
      await para.logout();
      await handleCheckIfAuthenticated();
    } catch (err: any) {
      setError(err.message || 'An error occurred during logout');
    }
  };

  return (
    <main className='flex flex-col items-center justify-center min-h-screen gap-6 p-8'>
      <h1 className='text-2xl font-bold'>
        Custom OAuth Auth + Para Example + Swig Wallet
      </h1>
      <p className='max-w-md text-center'>
        This example demonstrates a minimal custom OAuth authentication flow
        using Para's SDK combined with Swig wallet sdk.
      </p>

      {isConnected ? (
        <WalletDisplay walletAddress={wallet} onLogout={handleLogout} />
      ) : (
        <>
          <Button onClick={() => setIsModalOpen(true)}>
            Connect with Para
          </Button>
          <ParaModal
            para={para}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            logo=''
            theme={{}}
            oAuthMethods={['GOOGLE', 'TWITTER', 'TELEGRAM']}
            disableEmailLogin
            disablePhoneLogin
            authLayout={['AUTH:FULL', 'EXTERNAL:FULL']}
            externalWallets={[]}
            recoverySecretStepEnabled
            onRampTestMode={true}
          />
        </>
      )}
      {error && <p className='text-red-500 text-sm text-center'>{error}</p>}
    </main>
  );
};

export default ParaOAuth;
