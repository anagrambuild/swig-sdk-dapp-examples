import { Button } from '@swig/ui';
import {
  Actions,
  createSwig,
  Ed25519Authority,
  findSwigPda,
} from '@swig-wallet/classic';
import { PublicKey, Connection } from '@solana/web3.js';

interface WalletDisplayProps {
  walletAddress?: string;
  onLogout: () => Promise<void>;
}

const createSwigAccount = async (walletAddress: string) => {
  try {
    console.log(
      'Attempting to create Swig account with wallet address:',
      walletAddress
    );

    // Validate the wallet address
    if (!walletAddress || walletAddress === 'unknown') {
      throw new Error('Invalid wallet address');
    }

    // Try to create a PublicKey to validate the address format
    console.log('Creating PublicKey from address:', walletAddress);
    const publicKey = new PublicKey(walletAddress);
    console.log('PublicKey created successfully:', publicKey.toString());

    // Temporarily comment out crypto usage
    // const id = new Uint8Array(32);
    // window.crypto.getRandomValues(id);
    const id = new Uint8Array(32).fill(0); // Temporary fix

    // Find the PDA for the Swig account
    const [swigAddress] = findSwigPda(id);

    // Create the root authority from the wallet address
    const rootAuthority = new Ed25519Authority(publicKey);

    // Set up root actions (all permissions)
    const rootActions = Actions.set().all().get();

    // Create the Swig account
    await createSwig(
      new Connection('http://localhost:8899', 'confirmed'),
      id,
      rootAuthority,
      rootActions,
      publicKey,
      [] // No signers needed since we're using the wallet address
    );

    console.log(
      'Swig account created successfully at:',
      swigAddress.toString()
    );
    return swigAddress;
  } catch (error) {
    console.error('Error creating Swig account:', error);
    throw error;
  }
};

export const WalletDisplay = ({
  walletAddress,
  onLogout,
}: WalletDisplayProps) => {
  console.log('WalletDisplay received walletAddress:', walletAddress);

  const handleCreateSwig = async () => {
    if (!walletAddress) return;
    try {
      await createSwigAccount(walletAddress);
    } catch (error) {
      console.error('Failed to create Swig account:', error);
    }
  };

  return (
    <div className='text-center flex flex-col gap-2'>
      <h2 className='text-xl font-bold'>You are logged in!</h2>
      {walletAddress ? (
        <div className='flex flex-col gap-2'>
          <p>
            Your first wallet address is: <strong>{walletAddress}</strong>
          </p>
          <div className='flex flex-col gap-2 justify-center w-[50%] mx-auto'>
            <Button onClick={handleCreateSwig}>Set up Swig wallet</Button>
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
};
