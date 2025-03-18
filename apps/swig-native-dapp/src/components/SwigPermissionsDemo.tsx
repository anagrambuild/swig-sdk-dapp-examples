import React, { useState } from 'react';
import { Button } from '@swig/ui';

interface SwigPermissionsDemoProps {
  publicKey: string;
  role: string | null;
}

const SwigPermissionsDemo: React.FC<SwigPermissionsDemoProps> = ({ publicKey, role }) => {
  const [requestResult, setRequestResult] = useState<string | null>(null);
  
  // Map of role IDs to permissions
  const rolePermissions = {
    'admin': ['read', 'write', 'transfer'],
    'readonly': ['read'],
    'transaction': ['read', 'transfer']
  };
  
  const requestPermissions = (permission: string) => {
    console.log(`Requesting permission: ${permission}`);
    
    // Get current role's permissions
    const currentPermissions = role ? rolePermissions[role as keyof typeof rolePermissions] || [] : [];
    
    // Check if role has the requested permission
    if (currentPermissions.includes(permission)) {
      setRequestResult(`Permission "${permission}" granted for role: ${role}`);
    } else {
      setRequestResult(`Permission "${permission}" denied for role: ${role}. Available permissions: ${currentPermissions.join(', ')}`);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-medium text-gray-900">Swig Permissions Demo</h2>
      <p className="mt-2 text-sm text-gray-600">
        Test role-based permissions by requesting access to different actions.
      </p>
      
      <div className="mt-4 space-x-4">
        <Button onClick={() => requestPermissions('read')} variant="secondary">
          Request Read Access
        </Button>
        <Button onClick={() => requestPermissions('write')} variant="secondary">
          Request Write Access
        </Button>
        <Button onClick={() => requestPermissions('transfer')} variant="secondary">
          Request Transfer Access
        </Button>
      </div>
      
      {requestResult && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <p className="text-sm">{requestResult}</p>
        </div>
      )}
    </div>
  );
};

export default SwigPermissionsDemo;
