import { Button, Select } from '@swig/ui';
import { useSwigContext } from '../../../context/SwigContext';
import { useState, useEffect } from 'react';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

interface DefiProps {
  walletAddress?: string;
  onLogout: () => Promise<void>;
}

const RECIPIENT_ADDRESS = 'BKV7zy1Q74pyk3eehMrVQeau9pj2kEp6k36RZwFTFdHk';

const Defi: React.FC<DefiProps> = ({ walletAddress, onLogout }) => {
  const { roles, swigAddress } = useSwigContext();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [solAmount, setSolAmount] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const roleOptions = roles.map((role, index) => ({
    value: index.toString(),
    label: role.name || `Role ${index + 1}`,
  }));

  useEffect(() => {
    const fetchBalance = async () => {
      if (swigAddress && selectedRole) {
        try {
          const connection = new Connection(
            'http://localhost:8899',
            'confirmed'
          );
          const balanceInLamports = await connection.getBalance(
            new PublicKey(swigAddress)
          );
          const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
          setBalance(balanceInSol);
          console.log('Swig wallet balance:', balanceInSol, 'SOL');

          // Get the selected role's SOL limit
          const role = roles[parseInt(selectedRole)];
          if (role?.canSpendSol) {
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

            const maxSolAmount = Number(maxLamports) / LAMPORTS_PER_SOL;
            console.log('Selected role max SOL limit:', maxSolAmount, 'SOL');
          }
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      } else {
        setBalance(null);
      }
    };

    fetchBalance();
  }, [swigAddress, selectedRole, roles, isTransferring]);

  const handleTransfer = async () => {
    if (!selectedRole || !solAmount || !swigAddress) return;
    setIsTransferring(true);
    try {
      const connection = new Connection('http://localhost:8899', 'confirmed');
      const role = roles[parseInt(selectedRole)];

      if (!role.canSpendSol()) {
        throw new Error('Selected role cannot spend SOL');
      }

      // TODO: Implement the actual transfer using Swig SDK
      console.log(
        `Transferring ${solAmount} SOL to ${RECIPIENT_ADDRESS} using role ${selectedRole}`
      );
      console.log('Current Swig wallet balance:', balance, 'SOL');

      // Add a delay to simulate transaction time
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Transfer failed: ' + (error as Error).message);
    } finally {
      setIsTransferring(false);
    }
  };

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

        {swigAddress && roles.length > 0 && (
          <div className='flex flex-col gap-2 max-w-md mx-auto mt-4'>
            <h3 className='text-lg font-medium'>Select Role</h3>
            <Select
              value={selectedRole}
              onChange={(value) => setSelectedRole(value as string)}
              options={roleOptions}
              placeholder='Select a role'
            />
            {selectedRole && (
              <div className='mt-2 p-4 border rounded'>
                <h4 className='font-medium mb-2'>Selected Role Details</h4>
                <p>Role Name: {roles[parseInt(selectedRole)].name}</p>
                <p>
                  Can Manage Authority:{' '}
                  {roles[parseInt(selectedRole)]?.canManageAuthority?.() ===
                  true
                    ? 'Yes'
                    : 'No'}
                </p>
                <p>
                  Can Spend SOL:{' '}
                  {roles[parseInt(selectedRole)]?.canSpendSol?.() === true
                    ? 'Yes'
                    : 'No'}
                </p>
                {balance !== null && (
                  <p className='mt-2 text-blue-600'>
                    Available Balance: {balance.toFixed(4)} SOL
                  </p>
                )}
              </div>
            )}

            <div className='mt-4 p-4 border rounded shadow-md'>
              <h4 className='font-medium mb-2'>Transfer SOL</h4>
              <p className='text-sm text-gray-600 mb-2'>
                Recipient:{' '}
                <span className='font-mono'>{RECIPIENT_ADDRESS}</span>
              </p>
              <div className='flex gap-2'>
                <input
                  type='number'
                  value={solAmount}
                  onChange={(e) => setSolAmount(e.target.value)}
                  placeholder='Amount in SOL'
                  className='flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  min='0'
                  step='0.001'
                  disabled={!selectedRole || isTransferring}
                />
                <Button
                  variant='primary'
                  onClick={handleTransfer}
                  disabled={
                    !selectedRole ||
                    !solAmount ||
                    isTransferring ||
                    !roles[parseInt(selectedRole)]?.canSpendSol?.() ||
                    (balance !== null && Number(solAmount) > balance)
                  }
                >
                  {isTransferring ? 'Sending...' : 'Send SOL'}
                </Button>
              </div>
              {selectedRole &&
                !roles[parseInt(selectedRole)]?.canSpendSol?.() && (
                  <p className='text-sm text-red-500 mt-2'>
                    Selected role does not have permission to spend SOL
                  </p>
                )}
              {balance !== null && Number(solAmount) > balance && (
                <p className='text-sm text-red-500 mt-2'>
                  Insufficient balance for this transfer
                </p>
              )}
            </div>
          </div>
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
