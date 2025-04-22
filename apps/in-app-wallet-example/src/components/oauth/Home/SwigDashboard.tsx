import React, { useState } from 'react';
import { Button } from '@swig/ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
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

      <div className='mb-6'>
        <h2 className='text-xl font-medium mb-4'>Roles</h2>
        <Button variant='secondary' onClick={getRoles} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Get Swig roles'}
        </Button>
        {error && <p className='text-red-500 mt-2'>{error}</p>}
        {roles.length > 0 && (
          <div className='mt-4 flex gap-2 flex-wrap'>
            {roles.map((role, index) => {
              const isRootRole = index === 0;
              const hasAllPermissions =
                isRootRole && role?.canSpendSol?.() === true;

              let maxSolAmount = 0;
              if (!hasAllPermissions && role?.canSpendSol) {
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

                maxSolAmount = Number(maxLamports) / LAMPORTS_PER_SOL;
              }

              return (
                <div
                  key={index}
                  className='p-4 border rounded shadow-md min-w-[200px]'
                >
                  <h3 className='font-medium'>{role.name}</h3>
                  <div className='space-y-1'>
                    <p>
                      Can manage authority:{' '}
                      {role?.canManageAuthority?.() === true ? 'Yes' : 'No'}
                    </p>
                    <p>
                      Can spend SOL:{' '}
                      {role?.canSpendSol?.() === true ? 'Yes' : 'No'}
                    </p>
                    {role?.canSpendSol?.() === true && (
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
  );
};

export default SwigDashboard;
