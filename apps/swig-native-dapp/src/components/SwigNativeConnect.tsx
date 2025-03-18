import React, { useState } from 'react';
import { Button } from '@swig/ui';

// Mock swig wallet roles for demonstration
const mockRoles = [
  { id: 'admin', name: 'Admin', permissions: ['read', 'write', 'transfer'] },
  { id: 'readonly', name: 'Read Only', permissions: ['read'] },
  { id: 'transaction', name: 'Transaction', permissions: ['read', 'transfer'] }
];

interface SwigNativeConnectProps {
  onConnect: (publicKey: string, role: string) => void;
  onDisconnect: () => void;
}

const SwigNativeConnect: React.FC<SwigNativeConnectProps> = ({ onConnect, onDisconnect }) => {
  const [connected, setConnected] = useState(false);
  const [showRoleList, setShowRoleList] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  const connectWallet = () => {
    setShowRoleList(true);
  };
  
  const selectRole = (roleId: string) => {
    console.log(`Connecting with role: ${roleId}`);
    
    // Simulate successful connection with the selected role
    setTimeout(() => {
      const mockPublicKey = 'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq';
      setSelectedRole(roleId);
      setConnected(true);
      setShowRoleList(false);
      onConnect(mockPublicKey, roleId);
    }, 500);
  };
  
  const disconnectWallet = () => {
    console.log('Disconnecting wallet...');
    setConnected(false);
    setSelectedRole(null);
    onDisconnect();
  };
  
  return (
    <div>
      <h2 className="text-xl font-medium text-gray-900">Swig Native Connect</h2>
      <p className="text-sm text-gray-600 mt-1 mb-4">
        This example demonstrates connecting to a Swig wallet with role selection.
      </p>
      
      {!connected ? (
        <div className="mt-4">
          <Button onClick={connectWallet}>
            Connect Swig Wallet
          </Button>
          
          {showRoleList && (
            <div className="mt-2 bg-white border border-gray-200 rounded shadow-lg p-4">
              <h3 className="text-lg font-medium mb-2">Select a role</h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose which role you want to use for this application.
              </p>
              <ul className="space-y-2">
                {mockRoles.map((role) => (
                  <li key={role.id}>
                    <button
                      className="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
                      onClick={() => selectRole(role.id)}
                    >
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-gray-600">
                        Permissions: {role.permissions.join(', ')}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center">
            <span className="mr-2">🔐</span>
            <div>
              <div className="font-medium">Connected with Swig Wallet</div>
              <div className="text-sm text-gray-600">
                Role: {mockRoles.find(r => r.id === selectedRole)?.name || 'Unknown'}
              </div>
            </div>
            <Button 
              variant="secondary" 
              onClick={disconnectWallet}
              className="ml-4"
            >
              Disconnect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwigNativeConnect;
