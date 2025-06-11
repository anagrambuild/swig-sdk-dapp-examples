import React, { useState } from 'react';
import { Button } from '@swig/ui';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  PublicKey,
} from '@solana/web3.js';
import { useWallet } from '../contexts/WalletContext';

const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const CLUSTER = 'devnet';
const SWIG_EXTENSION_ID = 'ngkjcjceookedgnmacgheeblecefegce';

const TransactionDemo: React.FC = () => {
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<{
    signature: string;
    success: boolean;
    error?: string;
  } | null>(null);

  const sendTransaction = async () => {
    const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;
    if (isNaN(lamports) || lamports <= 0) {
      alert('Enter a valid amount');
      return;
    }

    if (!publicKey) {
      alert('No wallet connected');
      return;
    }

    if (!window.chrome?.runtime?.sendMessage) {
      alert('Swig extension not found or not supported in this environment.');
      return;
    }

    setIsLoading(true);
    setTxResult(null);

    let popup: Window | null = null;

    try {
      const connection = new Connection(SOLANA_RPC_URL);
      const recipient = Keypair.generate().publicKey;
      setRecipientAddress(recipient.toBase58());

      const senderPublicKey = new PublicKey(publicKey);

      // Create the transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderPublicKey,
          toPubkey: recipient,
          lamports,
        })
      );

      // Set recent blockhash and fee payer
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderPublicKey;

      // Serialize the transaction for the extension
      const serializedTx = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Tx = encodeURIComponent(serializedTx.toString('base64'));

      const requestId = crypto.randomUUID();

      // Set up message listener for extension response
      const responsePromise = new Promise<{
        success: boolean;
        signature?: string;
        error?: string;
        cancelled?: boolean;
      }>((resolve, reject) => {
        const listener = (event: MessageEvent) => {
          console.log('Received message event:', event.data);

          const msg = event.data;
          if (
            msg &&
            msg.source === 'swig-extension' &&
            msg.requestId === requestId
          ) {
            window.removeEventListener('message', listener);

            if (msg.action === 'transaction_signed') {
              console.log('Transaction signed successfully:', msg.signature);
              resolve({ success: true, signature: msg.signature });
            } else if (msg.action === 'transaction_cancelled') {
              console.log('Transaction was cancelled');
              resolve({ success: false, cancelled: true });
            } else if (msg.action === 'transaction_error') {
              console.log('Transaction error:', msg.error);
              resolve({ success: false, error: msg.error });
            } else {
              console.log('Unexpected message action:', msg.action);
              resolve({ success: false, error: 'Unexpected message action' });
            }
          }
        };

        window.addEventListener('message', listener);

        // Add timeout to prevent hanging
        setTimeout(() => {
          window.removeEventListener('message', listener);
          reject(new Error('Transaction signing timed out after 60 seconds'));
        }, 60000);
      });

      // Open the extension popup for transaction approval
      const popupUrl = `chrome-extension://${SWIG_EXTENSION_ID}/index.html#/transaction-request?transaction=${base64Tx}&requestId=${requestId}`;
      console.log('Opening popup:', popupUrl);

      popup = window.open(
        popupUrl,
        '_blank',
        'width=400,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Failed to open extension popup. Please allow popups for this site.');
      }

      // Wait for the extension response
      const response = await responsePromise;

      if (response.success && response.signature) {
        console.log('Transaction completed successfully:', response.signature);
        setTxResult({
          signature: response.signature,
          success: true,
        });
      } else if (response.cancelled) {
        console.log('Transaction was cancelled by user');
        setTxResult({
          signature: '',
          success: false,
          error: 'Transaction was cancelled by the user.',
        });
      } else {
        throw new Error(response.error || 'Transaction failed for unknown reason');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTxResult({
        signature: '',
        success: false,
        error: errorMessage,
      });
    } finally {
      if (popup && !popup.closed) {
        popup.close();
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-900">Swig Transfer Demo</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount (in SOL)
        </label>
        <input
          type="number"
          step="0.0001"
          min="0"
          placeholder="e.g. 0.05"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100"
        />
      </div>

      {publicKey && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Connected Wallet:</span>{' '}
          <span className="break-all font-mono text-xs">{publicKey}</span>
        </div>
      )}

      <Button
        disabled={isLoading || !publicKey || !amount}
        onClick={sendTransaction}
        className="w-full"
      >
        {isLoading ? 'Processing Transaction...' : 'Send Test Transaction'}
      </Button>

      {recipientAddress && (
        <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
          <span className="font-medium">Recipient Address:</span>{' '}
          <span className="break-all font-mono text-xs">{recipientAddress}</span>
        </div>
      )}

      {txResult && (
        <div
          className={`p-4 rounded-md border ${
            txResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          {txResult.success ? (
            <>
              <p className="text-green-800 font-semibold mb-2">✅ Transaction Successful!</p>
              <p className="text-green-700 text-xs break-all mb-2">
                <span className="font-medium">Signature:</span> {txResult.signature}
              </p>
              <a
                className="text-blue-600 text-sm inline-block underline hover:text-blue-800"
                href={`https://explorer.solana.com/tx/${txResult.signature}?cluster=${CLUSTER}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                🔗 View on Solana Explorer
              </a>
            </>
          ) : (
            <>
              <p className="text-red-800 font-semibold mb-2">❌ Transaction Failed</p>
              {txResult.error && (
                <p className="text-red-700 text-sm">{txResult.error}</p>
              )}
            </>
          )}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
            <span className="text-sm text-gray-600">Waiting for transaction approval...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDemo;