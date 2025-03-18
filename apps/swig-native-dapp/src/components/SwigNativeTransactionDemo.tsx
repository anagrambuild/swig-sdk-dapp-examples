import React, { useState } from 'react';
import { Button } from '@swig/ui';

interface SwigNativeTransactionDemoProps {
  publicKey: string;
}

const SwigNativeTransactionDemo: React.FC<SwigNativeTransactionDemoProps> = ({ publicKey }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [txResult, setTxResult] = useState<string | null>(null);
  
  const sendTransaction = async () => {
    setIsLoading(true);
    setTxResult(null);
    
    // Simulate transaction
    try {
      console.log('Sending mock transaction using Swig native methods...');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock transaction signature
      const signature = 'swig_native_tx_' + Math.random().toString(36).substring(2, 15);
      
      setTxResult(`Transaction sent successfully! Signature: ${signature}`);
      setIsLoading(false);
    } catch (error) {
      console.error('Transaction error:', error);
      setTxResult(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-medium text-gray-900">Swig Native Transaction Demo</h2>
      <p className="mt-2 text-sm text-gray-600">
        This demonstrates sending a transaction using Swig native integration.
      </p>
      
      <div className="mt-4">
        <Button 
          onClick={sendTransaction} 
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Test Transaction'}
        </Button>
        
        {txResult && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <p className="text-sm">{txResult}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwigNativeTransactionDemo;
