import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';

interface SwigPermissionsDemoProps {
  publicKey: string;
  role: string | null;
}

const SwigPermissionsDemo: React.FC<SwigPermissionsDemoProps> = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [selectedLendingPermission, setSelectedLendingPermission] = useState<
    string[]
  >([]);
  const [selectedDcaPermission, setSelectedDcaPermission] = useState<string[]>(
    []
  );
  const [selectedTradingPermission, setSelectedTradingPermission] = useState<
    string[]
  >([]);
  const [lendingSolRequired, setLendingSolRequired] = useState<number>(0);
  const [dcaSolRequired, setDcaSolRequired] = useState<number>(0);
  const [tradingSolRequired, setTradingSolRequired] = useState<number>(0);
  const [lendingTokens, setLendingTokens] = useState<string[]>([]);
  const [dcaTokens, setDcaTokens] = useState<string[]>([]);
  const [tradingTokens, setTradingTokens] = useState<string[]>([]);
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

  // const openSwigExtension = () => {
  //   setLoading(true);
  //   setError(null);
  //   setStatus('Opening Swig extension...');

  //   try {
  //     // Check if chrome.runtime is available
  //     if (window.chrome && window.chrome.runtime) {
  //       // Try to open the extension using Chrome's API
  //       window.chrome.runtime.sendMessage(
  //         swigExtensionId,
  //         { action: 'open_popup' },
  //         (response) => {
  //           setLoading(false);

  //           if (window.chrome?.runtime.lastError) {
  //             console.error(
  //               'Error opening extension:',
  //               window.chrome.runtime.lastError
  //             );
  //             setError(
  //               `Error opening extension: ${
  //                 window.chrome.runtime.lastError.message || 'Unknown error'
  //               }`
  //             );
  //             return;
  //           }

  //           if (response && response.success) {
  //             setStatus('Swig extension opened successfully');
  //           } else {
  //             setError(response?.error || 'Failed to open Swig extension');
  //           }
  //         }
  //       );
  //     } else {
  //       throw new Error(
  //         'Chrome extension API not available. Try using Chrome browser.'
  //       );
  //     }
  //   } catch (error) {
  //     setLoading(false);
  //     setError(
  //       `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  //     );

  //     // Fallback approach
  //     try {
  //       window.open(
  //         `chrome-extension://${swigExtensionId}/index.html`,
  //         '_blank'
  //       );
  //       setStatus('Attempted to open Swig extension in a new tab');
  //     } catch (fallbackError) {
  //       setError(
  //         `Fallback also failed: ${
  //           fallbackError instanceof Error
  //             ? fallbackError.message
  //             : 'Unknown error'
  //         }`
  //       );
  //     }
  //   }
  // };

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-xl font-medium text-gray-900'>
        Swig Permissions Demo
      </h2>
      <p className='mt-2 text-sm text-gray-600'>
        Test opening the Swig wallet extension to request different permissions.
      </p>

      <div className='flex flex-row gap-4 w-1/2 rounded-md'>
        <div
          className={`w-1/2 bg-gray-100 p-4 rounded-md cursor-pointer ${
            !isAdmin ? 'bg-green-500 text-white' : ''
          }`}
          onClick={() => setIsAdmin(false)}
        >
          User dashboard
        </div>
        <div
          className={`w-1/2 bg-gray-100 p-4 rounded-md cursor-pointer ${
            isAdmin ? 'bg-green-500 text-white' : ''
          }`}
          onClick={() => setIsAdmin(true)}
        >
          Admin dashboard
        </div>
      </div>

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

      {isAdmin ? (
        <AdminDashboard
          selectedLendingPermission={selectedLendingPermission}
          setSelectedLendingPermission={setSelectedLendingPermission}
          selectedDcaPermission={selectedDcaPermission}
          setSelectedDcaPermission={setSelectedDcaPermission}
          selectedTradingPermission={selectedTradingPermission}
          setSelectedTradingPermission={setSelectedTradingPermission}
          lendingSolRequired={lendingSolRequired}
          setLendingSolRequired={setLendingSolRequired}
          dcaSolRequired={dcaSolRequired}
          setDcaSolRequired={setDcaSolRequired}
          tradingSolRequired={tradingSolRequired}
          setTradingSolRequired={setTradingSolRequired}
          lendingTokens={lendingTokens}
          setLendingTokens={setLendingTokens}
          dcaTokens={dcaTokens}
          setDcaTokens={setDcaTokens}
          tradingTokens={tradingTokens}
          setTradingTokens={setTradingTokens}
        />
      ) : (
        <UserDashboard
          requestPermission={requestPermission}
          loading={loading}
        />
      )}
    </div>
  );
};

export default SwigPermissionsDemo;
