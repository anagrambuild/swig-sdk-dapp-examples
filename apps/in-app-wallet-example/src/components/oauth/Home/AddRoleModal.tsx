import React, { useState } from 'react';
import { Modal, Button } from '@swig/ui';
import { useSwigContext } from '../../../context/SwigContext';

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddRoleModal: React.FC<AddRoleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addRole, isAddingRole, error } = useSwigContext();
  const [solAmount, setSolAmount] = useState<string>('');
  const [roleName, setRoleName] = useState<string>('');

  const handleAddRole = async () => {
    if (!solAmount || !roleName) return;
    await addRole(roleName, solAmount);
    setSolAmount('');
    setRoleName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Add New Role'>
      <div className='flex flex-col gap-4'>
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
        {error && <p className='text-red-500'>{error}</p>}
        <div className='mt-4 flex justify-end gap-3'>
          <Button variant='secondary' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddRole}
            disabled={isAddingRole || !solAmount || !roleName}
          >
            {isAddingRole ? 'Adding Role...' : 'Add Role'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
