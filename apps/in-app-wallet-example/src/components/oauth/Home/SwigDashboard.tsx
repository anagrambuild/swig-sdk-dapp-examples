import React, { useState, useEffect } from 'react';
import { Button } from '@swig/ui';
import { LAMPORTS_PER_SOL, Connection, PublicKey } from '@solana/web3.js';
import { useSwigContext } from '../../../context/SwigContext';
import { AddRoleModal } from './AddRoleModal';
import { PlusIcon } from '@heroicons/react/24/outline';
import SwigAdd from './SwigAdd';

interface SwigDashboardProps {
  walletAddress?: string;
}

const SwigDashboard: React.FC<SwigDashboardProps> = () => {
  const {
    roles,
    swigAddress,
    isSettingUp,
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
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);

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
    const fetchBalanceAndRoles = async () => {
      if (swigAddress) {
        try {
          // Fetch balance
          const connection = new Connection(
            'http://localhost:8899',
            'confirmed'
          );
          const balanceInLamports = await connection.getBalance(
            new PublicKey(swigAddress)
          );
          const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
          setWalletBalance(balanceInSol);

          // Fetch roles
          await getRoles();
        } catch (error) {
          console.error('Error fetching wallet data:', error);
        }
      }
    };

    fetchBalanceAndRoles();
  }, [swigAddress, isAddingRole, getRoles]);

  const handleAddRole = async () => {
    if (!solAmount || !roleName) return;
    await addRole(roleName, solAmount);
    setSolAmount('');
    setRoleName('');
  };

  if (!swigAddress) {
    return <SwigAdd />;
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
          <div className='flex justify-between items-center mb-2'>
            <h4 className='font-medium'>Swig Wallet Overview</h4>
            <Button
              onClick={() => setIsAddRoleModalOpen(true)}
              className='flex items-center gap-2'
            >
              <PlusIcon className='h-5 w-5' />
              Add Role
            </Button>
          </div>
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
            <p className='text-sm font-medium mb-1'>Role Permissions:</p>
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
                <div key={index} className='mb-3 last:mb-0'>
                  <div className='flex justify-between items-center text-sm font-medium'>
                    <span>{role.name || `Role ${index + 1}`}</span>
                  </div>
                  <div className='flex flex-col gap-1 mt-1 text-sm'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Manage Authority:</span>
                      <span
                        className={
                          role?.canManageAuthority?.()
                            ? 'text-blue-600'
                            : 'text-gray-500'
                        }
                      >
                        {role?.canManageAuthority?.() ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>SOL Spending:</span>
                      <span
                        className={
                          role?.canSpendSol?.()
                            ? 'text-blue-600'
                            : 'text-gray-500'
                        }
                      >
                        {role?.canSpendSol?.()
                          ? `${limit.toFixed(4)} SOL`
                          : 'No permission'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AddRoleModal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
      />
    </div>
  );
};

export default SwigDashboard;
