import { Button } from '@swig/ui';

interface DefiProps {
  walletAddress?: string;
  onLogout: () => Promise<void>;
}

const Defi: React.FC<DefiProps> = ({ walletAddress, onLogout }) => {
  return (
    <div className='flex flex-col gap-2 justify-between flex-grow'>
      <div className='flex flex-col gap-4 justify-center'>
        <h2 className='text-xl font-medium mb-2'>You are logged in!</h2>
        {walletAddress ? (
          <div className='flex flex-col gap-2'>
            <p>
              Your first wallet address is:{' '}
              <span className='font-mono'>{walletAddress}</span>
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
  );
};

export default Defi;
