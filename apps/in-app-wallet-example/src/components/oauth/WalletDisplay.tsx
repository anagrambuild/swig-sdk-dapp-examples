import { Button } from '@swig/ui';

interface WalletDisplayProps {
  walletAddress?: string;
  onLogout: () => Promise<void>;
}

export const WalletDisplay = ({
  walletAddress,
  onLogout,
}: WalletDisplayProps) => (
  <div className='text-center flex flex-col gap-2'>
    <h2 className='text-xl font-bold'>You are logged in!</h2>
    {walletAddress ? (
      <div className='flex flex-col gap-2'>
        <p>
          Your first wallet address is: <strong>{walletAddress}</strong>
        </p>
        <div className='flex flex-col gap-2 justify-center w-[50%] mx-auto'>
          <Button>Set up Swig wallet</Button>
          <Button variant='secondary' onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    ) : (
      <p>No wallet found.</p>
    )}
  </div>
);
