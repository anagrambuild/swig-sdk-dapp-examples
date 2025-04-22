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
  const [permissionType, setPermissionType] = useState<'locked' | 'permissive'>(
    'locked'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [solAmount, setSolAmount] = useState<string>('');
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = {
    publicKey: new PublicKey(walletAddress!),
    signTransaction: async (tx: Transaction) => {
      return tx;
    },
  };

  const getSwigRoles = async () => {
    if (!swigAddress) return [];
    try {
      const connection = new Connection('http://localhost:8899', 'confirmed');
      const swig = await fetchSwig(connection, new PublicKey(swigAddress));
      return swig.roles || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  };

  const handleSetupSwigWallet = async () => {
    try {
      setIsSettingUp(true);
      const connection = new Connection('http://localhost:8899', 'confirmed');
      const { swigAddress, rootKeypairSecret } = await createSwigAccount(
        connection,
        permissionType
      );
      setSwigAddress(swigAddress.toBase58());
      // Store the root keypair secret in localStorage
      localStorage.setItem('rootKeypair', JSON.stringify(rootKeypairSecret));
    } catch (error) {
      console.error('Failed to set up Swig wallet:', error);
    } finally {
      setIsSettingUp(false);
    }
  };

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
    if (!swigAddress || !solAmount) return;

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

      // Get the root keypair from localStorage
      const rootKeypairSecret = localStorage.getItem('rootKeypair');
      if (!rootKeypairSecret) {
        throw new Error('Root keypair not found');
      }
      const rootKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(rootKeypairSecret))
      );

      // Create the instruction to add the new authority
      const addAuthorityIx = addAuthorityInstruction(
        rootRole,
        rootKeypair.publicKey,
        newAuthority,
        actions
      );

      // Create and sign the transaction
      const transaction = new Transaction().add(addAuthorityIx);
      transaction.feePayer = rootKeypair.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      // Sign the transaction with the root keypair
      transaction.sign(rootKeypair);

      // Send and confirm the transaction
      const signature = await connection.sendRawTransaction(
        transaction.serialize()
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
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <label className='text-sm font-medium'>Permission Type</label>
              <div className='flex gap-4 justify-between'>
                <label className='flex items-center gap-2'>
                  <input
                    type='radio'
                    name='permissionType'
                    value='locked'
                    checked={permissionType === 'locked'}
                    onChange={(e) => setPermissionType('locked')}
                    className='form-radio'
                  />
                  <span>Manage Authority Only</span>
                </label>
                <label className='flex items-center gap-2'>
                  <input
                    type='radio'
                    name='permissionType'
                    value='permissive'
                    checked={permissionType === 'permissive'}
                    onChange={(e) => setPermissionType('permissive')}
                    className='form-radio'
                  />
                  <span>All Permissions</span>
                </label>
              </div>
              <p className='text-sm text-gray-600'>
                {permissionType === 'locked'
                  ? 'Root authority can only manage other roles. Additional roles will need to be created for spending SOL.'
                  : 'Root authority has full permissions including SOL spending.'}
              </p>
            </div>
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
          <div className='mt-4 flex gap-2 flex-wrap'>
            {roles.map((role, index) => {
              // For the first role (root role), check if it has all permissions
              const isRootRole = index === 0;
              const hasAllPermissions = isRootRole && role.canSpendSol();

              // Binary search to find the exact SOL limit (only for non-root roles or root roles with limits)
              let maxSolAmount = 0;
              if (!hasAllPermissions) {
                let left = BigInt(0);
                let right = BigInt(100 * LAMPORTS_PER_SOL); // Start with 5 SOL as max
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

                maxSolAmount = Number(maxLamports) / LAMPORTS_PER_SOL;
              }

              const roleId = role.id.toString();

              return (
                <div
                  key={index}
                  className='p-4 border rounded shadow-md min-w-[200px]'
                >
                  <h3 className='font-medium'>Role {roleId}</h3>
                  <div className='space-y-1'>
                    <p>
                      Can manage authority:{' '}
                      {role.canManageAuthority() ? 'Yes' : 'No'}
                    </p>
                    <p>Can spend SOL: {role.canSpendSol() ? 'Yes' : 'No'}</p>
                    {role.canSpendSol() && (
                      <div>
                        <p>
                          Maximum SOL amount:{' '}
                          {hasAllPermissions ? 'Unlimited' : maxSolAmount}
                        </p>
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
