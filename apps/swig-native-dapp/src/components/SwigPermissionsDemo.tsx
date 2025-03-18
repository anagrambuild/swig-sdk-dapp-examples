import React, { useState } from 'react';

interface SwigPermissionsDemoProps {
  publicKey: string;
  role: string | null;
}

const SwigPermissionsDemo: React.FC<SwigPermissionsDemoProps> = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // This is the Chrome extension ID for the Swig wallet
  // Replace with your actual extension ID
  const swigExtensionId = 'khnahinkhjfaolcbjaamlopkknpcapgn';

  const requestPermission = async (permissionType: string) => {
    setLoading(true);
    setError(null);
    setStatus(`Requesting ${permissionType} permission...`);

    try {
      // Check if chrome.runtime is available
      if (window.chrome && window.chrome.runtime) {
        // Open the extension with a permission request
        window.chrome.runtime.sendMessage(
          swigExtensionId,
          {
            action: 'request_permissions',
            appName: 'Jupiter DEX',
            appIcon: window.location.origin + '/favicon.ico',
            permissions: [permissionType],
            origin: window.location.origin,
            navigate: {
              screen: 'permissions-request',
              params: { requestedPermission: permissionType },
            },
          },
          (response) => {
            setLoading(false);

            if (window.chrome?.runtime.lastError) {
              console.error(
                'Error opening extension:',
                window.chrome.runtime.lastError
              );
              setError(
                `Error opening extension: ${
                  window.chrome.runtime.lastError.message || 'Unknown error'
                }`
              );
              return;
            }

            if (response && response.success) {
              setStatus(
                `Permission request sent to Swig Wallet. Check the extension to approve.`
              );
            } else {
              setError(response?.error || 'Failed to send permission request');
            }
          }
        );
      } else {
        throw new Error(
          'Chrome extension API not available. Try using Chrome browser.'
        );
      }
    } catch (error) {
      setLoading(false);
      setError(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      // Fallback approach - try to open the extension in a new tab
      try {
        window.open(
          `chrome-extension://${swigExtensionId}/index.html#/permissions-request`,
          '_blank'
        );
        setStatus('Attempted to open Swig extension in a new tab');
      } catch (fallbackError) {
        setError(
          `Fallback also failed: ${
            fallbackError instanceof Error
              ? fallbackError.message
              : 'Unknown error'
          }`
        );
      }
    }
  };

  const openSwigExtension = () => {
    setLoading(true);
    setError(null);
    setStatus('Opening Swig extension...');

    try {
      // Check if chrome.runtime is available
      if (window.chrome && window.chrome.runtime) {
        // Try to open the extension using Chrome's API
        window.chrome.runtime.sendMessage(
          swigExtensionId,
          { action: 'open_popup' },
          (response) => {
            setLoading(false);

            if (window.chrome?.runtime.lastError) {
              console.error(
                'Error opening extension:',
                window.chrome.runtime.lastError
              );
              setError(
                `Error opening extension: ${
                  window.chrome.runtime.lastError.message || 'Unknown error'
                }`
              );
              return;
            }

            if (response && response.success) {
              setStatus('Swig extension opened successfully');
            } else {
              setError(response?.error || 'Failed to open Swig extension');
            }
          }
        );
      } else {
        throw new Error(
          'Chrome extension API not available. Try using Chrome browser.'
        );
      }
    } catch (error) {
      setLoading(false);
      setError(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      // Fallback approach
      try {
        window.open(
          `chrome-extension://${swigExtensionId}/index.html`,
          '_blank'
        );
        setStatus('Attempted to open Swig extension in a new tab');
      } catch (fallbackError) {
        setError(
          `Fallback also failed: ${
            fallbackError instanceof Error
              ? fallbackError.message
              : 'Unknown error'
          }`
        );
      }
    }
  };

  return (
    <div>
      <h2 className='text-xl font-medium text-gray-900'>
        Swig Permissions Demo
      </h2>
      <p className='mt-2 text-sm text-gray-600'>
        Test opening the Swig wallet extension to request different permissions.
      </p>

      {error && (
        <div className='mt-4 p-3 bg-red-100 text-red-700 rounded-md'>
          {error}
        </div>
      )}

      {status && !error && (
        <div className='mt-4 p-3 bg-green-100 text-green-700 rounded-md'>
          {status}
        </div>
      )}

      <div className='mt-6'>
        <button
          onClick={() => requestPermission('view_balance')}
          disabled={loading}
          className='py-2 px-4 mr-3 mb-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
        >
          Request View Balance Permission
        </button>

        <button
          onClick={() => requestPermission('sign_transactions')}
          disabled={loading}
          className='py-2 px-4 mr-3 mb-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
        >
          Request Sign Transactions Permission
        </button>

        <button
          onClick={() => requestPermission('create_sub_account')}
          disabled={loading}
          className='py-2 px-4 mr-3 mb-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
        >
          Request Create Sub-Account Permission
        </button>
      </div>

      <div className='mt-6'>
        <button
          onClick={openSwigExtension}
          disabled={loading}
          className='py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50'
        >
          Just Open Swig Extension
        </button>
      </div>
    </div>
  );
};

export default SwigPermissionsDemo;
