import React, { useState } from 'react';
import { Button } from '@swig/ui';
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  Keypair,
} from '@solana/web3.js';
import {
  fetchSwig,
  Role,
  Actions,
  Ed25519Authority,
  addAuthorityInstruction,
  createSwig,
  findSwigPda,
} from '@swig-wallet/classic';
import { createSwigAccount } from '../../../utils/swig';

interface SwigDashboardProps {
  walletAddress?: string;
}

const SwigDashboard: React.FC<SwigDashboardProps> = ({
  walletAddress,
}: {
  walletAddress?: string;
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [swigAddress, setSwigAddress] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [solAmount, setSolAmount] = useState<string>('');
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rootSolLimit, setRootSolLimit] = useState<string>('');
  const [isCreatingSwig, setIsCreatingSwig] = useState(false);

  const wallet = {
    publicKey: new PublicKey(walletAddress!),
    signTransaction: async (tx: Transaction) => {
      return tx;
    },
  };

  const getSwigRoles = async () => {
    if (!swigAddress) return [];
    const connection = new Connection('http://localhost:8899', 'confirmed');
    const swig = await fetchSwig(connection, new PublicKey(swigAddress));
    return swig.roles;
  };

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

  //   const handleCreateSwig = async () => {
  //     if (!wallet) return;

  //     try {
  //       setIsCreatingSwig(true);
  //       setError(null);
  //       const connection = new Connection('http://localhost:8899', 'confirmed');

  //       // Generate random ID for the Swig account
  //       const id = crypto.getRandomValues(new Uint8Array(32));
  //       const [swigPda] = findSwigPda(id);

  //       // Create root authority from wallet public key
  //       const rootAuthority = new Ed25519Authority(wallet.publicKey);

  //       // Set up root actions - either unlimited or with SOL limit
  //       const actions = Actions.set().manageAuthority(); // Always need this to manage other roles

  //       if (rootSolLimit) {
  //         const solAmountInLamports = BigInt(
  //           Number(rootSolLimit) * LAMPORTS_PER_SOL
  //         );
  //         actions.solLimit({ amount: solAmountInLamports });
  //       } else {
  //         actions.all(); // Full permissions if no limit specified
  //       }

  //       // Create a temporary keypair for signing
  //       const tempKeypair = Keypair.generate();

  //       // Create the Swig account
  //       await createSwig(
  //         connection,
  //         id,
  //         rootAuthority,
  //         actions.get(),
  //         wallet.publicKey,
  //         [tempKeypair]
  //       );

  //       // Wait for transaction to be confirmed
  //       await new Promise((resolve) => setTimeout(resolve, 3000));

  //       console.log('Swig account created at:', swigPda.toBase58());
  //       onSwigCreated(swigPda.toBase58());
  //       setRootSolLimit('');
  //     } catch (error) {
  //       console.error('Failed to create Swig account:', error);
  //       setError('Failed to create Swig account. Please try again.');
  //     } finally {
  //       setIsCreatingSwig(false);
  //     }
  //   };

  const handleGetRoles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedRoles = await getSwigRoles();
      setRoles(fetchedRoles);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setError('Failed to fetch roles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!swigAddress || !solAmount || !wallet) return;

    try {
      setIsAddingRole(true);
      setError(null);
      const connection = new Connection('http://localhost:8899', 'confirmed');
      const swig = await fetchSwig(connection, new PublicKey(swigAddress));

      // Find the root role that can manage authority
      const rootRole = swig.roles.find((role) => role.canManageAuthority());
      if (!rootRole) {
        throw new Error('No role found with authority management permissions');
      }

      // Create a new authority for the role
      const newKeypair = Keypair.generate();
      const newAuthority = new Ed25519Authority(newKeypair.publicKey);

      // Set up actions with SOL spending limit
      const solAmountInLamports = BigInt(Number(solAmount) * LAMPORTS_PER_SOL);
      const actions = Actions.set()
        .solLimit({ amount: solAmountInLamports })
        .get();

      // Create the instruction to add the new authority
      const addAuthorityIx = addAuthorityInstruction(
        rootRole,
        wallet.publicKey,
        newAuthority,
        actions
      );

      // Create and sign the transaction
      const transaction = new Transaction().add(addAuthorityIx);
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      // Sign the transaction
      const signedTx = await wallet.signTransaction(transaction);

      // Send and confirm the transaction
      const signature = await connection.sendRawTransaction(
        signedTx.serialize()
      );
      await connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash,
        lastValidBlockHeight: (
          await connection.getLatestBlockhash()
        ).lastValidBlockHeight,
      });

      console.log('Transaction confirmed:', signature);

      // Refresh roles after adding
      await handleGetRoles();
      setSolAmount('');
    } catch (error) {
      console.error('Failed to add role:', error);
      setError('Failed to add role. Please try again.');
    } finally {
      setIsAddingRole(false);
    }
  };

  if (!swigAddress) {
    return (
      <div className='text-center'>
        <h2 className='text-xl font-medium mb-4'>Create a Swig Wallet</h2>
        <div className='flex flex-col gap-4 max-w-md mx-auto'>
          {swigAddress && (
            <p>
              Your Swig wallet address is: <strong>{swigAddress}</strong>
            </p>
          )}
          <div className='flex flex-col gap-2'>
            <label htmlFor='rootSolLimit' className='text-sm font-medium'>
              Root Role SOL Spending Limit (Optional)
            </label>
            <input
              id='rootSolLimit'
              type='number'
              value={rootSolLimit}
              onChange={(e) => setRootSolLimit(e.target.value)}
              placeholder='Leave empty for unlimited'
              className='px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              min='0'
              step='0.1'
            />
            <p className='text-sm text-gray-600'>
              If set, the root role will be limited to this SOL amount.
              Otherwise, it will have unlimited permissions.
            </p>
          </div>
          <Button
            onClick={handleSetupSwigWallet}
            disabled={isSettingUp || !!swigAddress}
          >
            {isSettingUp ? 'Setting up...' : 'Set up Swig wallet'}
          </Button>
          {error && <p className='text-red-500'>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-2 items-center flex-grow w-full'>
      <div className='mb-6'>
        <h2 className='text-xl font-medium mb-2'>Swig Wallet Details</h2>
        <p className='text-gray-600'>
          Address: <span className='font-mono'>{swigAddress}</span>
        </p>
      </div>

      <div className='mb-6'>
        <h2 className='text-xl font-medium mb-4'>Roles</h2>
        <Button
          variant='secondary'
          onClick={handleGetRoles}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Get Swig roles'}
        </Button>
        {error && <p className='text-red-500 mt-2'>{error}</p>}
        {roles.length > 0 && (
          <div className='mt-4 space-y-4'>
            {roles.map((role, index) => {
              // Binary search to find the exact SOL limit
              let left = BigInt(0);
              let right = BigInt(5 * LAMPORTS_PER_SOL); // Start with 5 SOL as max
              let maxLamports = BigInt(0);

              while (left <= right) {
                const mid = (left + right) / BigInt(2);
                if (role.canSpendSol(mid)) {
                  maxLamports = mid;
                  left = mid + BigInt(1);
                } else {
                  right = mid - BigInt(1);
                }
              }

              const maxSolAmount = Number(maxLamports) / LAMPORTS_PER_SOL;
              const roleId = role.id.toString();

              return (
                <div key={index} className='p-4 border rounded'>
                  <h3 className='font-medium'>Role {roleId}</h3>
                  <div className='mt-2 space-y-1'>
                    <p>
                      Can manage authority:{' '}
                      {role.canManageAuthority() ? 'Yes' : 'No'}
                    </p>
                    <p>Can spend SOL: {role.canSpendSol() ? 'Yes' : 'No'}</p>
                    {role.canSpendSol() && (
                      <div>
                        <p>Maximum SOL amount: {maxSolAmount}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className='text-xl font-medium mb-4'>Add New Role</h2>
        <div className='flex flex-col gap-4 max-w-md'>
          <div className='flex flex-col gap-2'>
            <label htmlFor='solAmount' className='text-sm font-medium'>
              Maximum SOL Amount to Spend
            </label>
            <input
              id='solAmount'
              type='number'
              value={solAmount}
              onChange={(e) => setSolAmount(e.target.value)}
              placeholder='Enter amount in SOL'
              className='px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              min='0'
              step='0.1'
            />
          </div>
          <Button
            variant='secondary'
            onClick={handleAddRole}
            disabled={isAddingRole || !solAmount}
          >
            {isAddingRole ? 'Adding Role...' : 'Add New Role'}
          </Button>
          {error && <p className='text-red-500'>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default SwigDashboard;
