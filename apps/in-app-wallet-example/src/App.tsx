import React, { useState } from 'react';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import {
  Ed25519Authority,
  createSwig,
  findSwigPda,
  ActionsBuilder,
  SWIG_PROGRAM_ADDRESS,
  ProgramLimit,
  SolLimit,
} from '@swig-wallet/classic';
import { Buffer } from 'buffer';
import InAppWalletSetup from './components/InAppWalletSetup';
import InAppWalletDetails from './components/InAppWalletDetails';
import InAppTransactionDemo from './components/InAppTransactionDemo';

// Make Buffer available globally
window.Buffer = Buffer;

const App: React.FC = () => {
  const [walletCreated, setWalletCreated] = useState(false);
  const [walletInfo, setWalletInfo] = useState<{
    publicKey: string;
    authMethod: string;
    walletType: string;
  } | null>(null);
  const [swigAddress, setSwigAddress] = useState<string | null>(null);

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

  const testCreateSwig = async () => {
    try {
      const connection = new Connection('http://localhost:8899', 'confirmed');

      // Log the program ID
      console.log('SWIG_PROGRAM_ADDRESS:', SWIG_PROGRAM_ADDRESS.toString());
      console.log(
        'Expected program ID:',
        'swigNmWhy8RvUYXBKV5TSU8Hh3f4o5EczHouzBzEsLC'
      );

      // Generate a random ID for the Swig
      const id = new Uint8Array(13);
      crypto.getRandomValues(id);
      console.log('Swig ID:', Buffer.from(id).toString('hex'));

      // Generate a keypair for the root authority
      const rootKeypair = Keypair.generate();
      console.log(
        'Root authority public key:',
        rootKeypair.publicKey.toString()
      );

      // Request airdrop for the root authority and wait for confirmation
      const airdropSignature = await connection.requestAirdrop(
        rootKeypair.publicKey,
        LAMPORTS_PER_SOL
      );

      // Wait for the airdrop to be confirmed
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: airdropSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      // Find the Swig PDA
      const [swigAddress, bump] = findSwigPda(id);
      console.log('Swig PDA:', swigAddress.toString());
      console.log('Bump:', bump);

      // Create the root authority
      const rootAuthority = new Ed25519Authority(rootKeypair.publicKey);
      console.log(
        'Authority data:',
        Buffer.from(rootAuthority.data).toString('hex')
      );

      // Create actions with specific permissions
      const actions = ActionsBuilder.new()
        .manageAuthority()
        .solLimit({
          amount: 1000000000n, // 1 SOL
        } as SolLimit)
        .get();
      console.log(
        'Actions data:',
        Buffer.from(actions.bytes()).toString('hex')
      );
      console.log('Actions count:', actions.count);
      console.log('Actions bytes length:', actions.bytes().length);
      console.log('Actions raw bytes:', actions.bytes());

      // Create the Swig
      const signature = await createSwig(
        connection,
        id,
        rootAuthority,
        actions,
        rootKeypair.publicKey,
        [rootKeypair],
        { commitment: 'confirmed' }
      );

      console.log('Swig created successfully:', signature);
      setSwigAddress(swigAddress.toString());
    } catch (error: any) {
      console.error('Error creating Swig:', error);
      if (error.logs) {
        console.error('Transaction logs:', error.logs);
      }
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
      if (error.getLogs) {
        try {
          const fullLogs = await error.getLogs();
          console.error('Full transaction logs:', fullLogs);
        } catch (logError) {
          console.error('Error getting full logs:', logError);
        }
      }
    }
  };

  return (
    <div className='min-h-screen bg-gray-100'>
      <header className='bg-white shadow'>
        <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Swig In-App Wallet Example
          </h1>
          <p className='mt-2 text-gray-600'>
            This demonstrates a dapp that creates a Swig wallet for users within
            the application
          </p>
        </div>
      </header>
      <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        <div className='bg-white shadow overflow-hidden sm:rounded-lg p-6'>
          <div className='mb-4'>
            <button
              onClick={testCreateSwig}
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
            >
              Test Create Swig
            </button>
          </div>
          <div className='mb-4 text-green-500'>
            {swigAddress && (
              <p>Swig created successfully! Swig Address: {swigAddress}</p>
            )}
          </div>
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

              <div className='mt-8'>
                <InAppTransactionDemo publicKey={walletInfo?.publicKey || ''} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
