import React, { useState, useEffect } from 'react';
import { Button } from '@swig/ui';
import { LAMPORTS_PER_SOL, Connection, PublicKey } from '@solana/web3.js';
import { useSwigContext } from '../../../context/SwigContext';

interface SwigDashboardProps {
  walletAddress?: string;
}

const SwigDashboard: React.FC<SwigDashboardProps> = () => {
  const {
    roles,
    swigAddress,
    isSettingUp,
    isLoading,
    isAddingRole,
    error,
    permissionType,
    setPermissionType,
    setupSwigWallet,
    getRoles,
    addRole,
  } = useSwigContext();

  const [solAmount, setSolAmount] = useState<string>('');
  const [roleName, setRoleName] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Add a function to calculate total spending limits
  const calculateTotalSpendingLimits = () => {
    return roles.reduce((total, role) => {
      if (role?.canSpendSol?.()) {
        let left = BigInt(0);
        let right = BigInt(100 * LAMPORTS_PER_SOL);
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

        return total + Number(maxLamports) / LAMPORTS_PER_SOL;
      }
      return total;
    }, 0);
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (swigAddress) {
        try {
          const connection = new Connection(
            'http://localhost:8899',
            'confirmed'
          );
          const balanceInLamports = await connection.getBalance(
            new PublicKey(swigAddress)
          );
          const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
          setWalletBalance(balanceInSol);
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
    };

    fetchBalance();
  }, [swigAddress, isAddingRole]); // Refresh balance after adding roles

  const handleAddRole = async () => {
    if (!solAmount || !roleName) return;
    await addRole(roleName, solAmount);
    setSolAmount('');
    setRoleName('');
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
            onClick={setupSwigWallet}
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
        <p>
          Address: <span className='font-mono'>{swigAddress}</span>
        </p>
      </div>

      <div className='mb-6 w-full max-w-2xl'>
        <div className='p-4 border rounded bg-gray-50 mb-4'>
          <h4 className='font-medium mb-2'>Swig Wallet Overview</h4>
          {walletBalance !== null && (
            <p className='text-lg font-medium text-blue-600'>
              Total Balance: {walletBalance.toFixed(4)} SOL
            </p>
          )}
          <p className='text-sm text-gray-600 mt-1'>
            Total Spending Limits: {calculateTotalSpendingLimits().toFixed(4)}{' '}
            SOL
          </p>
          <div className='mt-3'>
            <p className='text-sm font-medium mb-1'>Role Spending Limits:</p>
            {roles.map((role, index) => {
              let limit = 0;
              if (role?.canSpendSol?.()) {
                let left = BigInt(0);
                let right = BigInt(100 * LAMPORTS_PER_SOL);
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

                limit = Number(maxLamports) / LAMPORTS_PER_SOL;
              }
              return (
                <div
                  key={index}
                  className='flex justify-between items-center text-sm'
                >
                  <span>{role.name || `Role ${index + 1}`}:</span>
                  <span
                    className={
                      role?.canSpendSol?.() ? 'text-blue-600' : 'text-gray-500'
                    }
                  >
                    {role?.canSpendSol?.()
                      ? `${limit.toFixed(4)} SOL`
                      : 'No spending limit'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <h2 className='text-xl font-medium mb-4'>Roles</h2>
        <Button variant='secondary' onClick={getRoles} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Get Swig roles'}
        </Button>
        {error && <p className='text-red-500 mt-2'>{error}</p>}

        <div className='mt-8 w-full flex flex-col items-center'>
          <h2 className='text-xl font-medium mb-4 w-full'>Add New Role</h2>
          <div className='flex flex-col gap-4 w-1/2'>
            <div className='flex flex-col gap-2'>
              <label htmlFor='roleName' className='text-sm font-medium'>
                Role Name
              </label>
              <input
                id='roleName'
                type='text'
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder='Enter role name'
                className='px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
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
              disabled={isAddingRole || !solAmount || !roleName}
            >
              {isAddingRole ? 'Adding Role...' : 'Add New Role'}
            </Button>
            {error && <p className='text-red-500'>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwigDashboard;
