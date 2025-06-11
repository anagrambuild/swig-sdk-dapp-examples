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

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderPublicKey,
          toPubkey: recipient,
          lamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderPublicKey;

      const serializedTx = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Tx = encodeURIComponent(serializedTx.toString('base64'));

      const requestId = crypto.randomUUID();

      const responsePromise = new Promise<{
        success: boolean;
        signature?: string;
        error?: string;
        cancelled?: boolean;
      }>((resolve, reject) => {
        const listener = (event: MessageEvent) => {
          const msg = event.data;
          if (
            msg &&
            msg.source === 'swig-extension' &&
            msg.requestId === requestId
          ) {
            window.removeEventListener('message', listener);

            if (msg.action === 'transaction_signed') {
              resolve({ success: true, signature: msg.signature });
            } else if (msg.action === 'transaction_cancelled') {
              resolve({ success: false, cancelled: true });
            } else if (msg.action === 'transaction_error') {
              resolve({ success: false, error: msg.error });
            } else {
              resolve({ success: false, error: 'Unexpected message action' });
            }
          }
        };

        window.addEventListener('message', listener);
        setTimeout(() => {
          window.removeEventListener('message', listener);
          reject(new Error('Transaction signing timed out after 60 seconds'));
        }, 60000);
      });

      const popupUrl = `chrome-extension://${SWIG_EXTENSION_ID}/index.html#/transaction-request?transaction=${base64Tx}&requestId=${requestId}`;
      popup = window.open(popupUrl, '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
      if (!popup) throw new Error('Failed to open extension popup.');

      const response = await responsePromise;

      if (response.success && response.signature) {
        setTxResult({ signature: response.signature, success: true });
      } else if (response.cancelled) {
        setTxResult({ signature: '', success: false, error: 'Transaction was cancelled by the user.' });
      } else {
        throw new Error(response.error || 'Transaction failed for unknown reason');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTxResult({ signature: '', success: false, error: errorMessage });
    } finally {
      if (popup && !popup.closed) popup.close();
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-md mx-auto bg-white rounded-none">
      <h2 className="text-2xl font-semibold text-gray-900 text-center">Swig Transfer Demo</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (in SOL)</label>
        <input
          type="number"
          step="0.0001"
          min="0"
          placeholder="e.g. 0.05"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      {publicKey && (
        <div className="text-sm text-gray-700">
          <span className="font-medium">Connected Wallet:</span>{' '}
          <span className="font-mono break-all text-xs">{publicKey}</span>
        </div>
      )}

      <Button
        disabled={isLoading || !publicKey || !amount}
        onClick={sendTransaction}
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Send Transaction'}
      </Button>

      {recipientAddress && (
        <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded border">
          <span className="font-medium">Recipient Address:</span>{' '}
          <span className="font-mono break-all text-xs">{recipientAddress}</span>
        </div>
      )}

      {txResult && (
        <div
          className={`p-4 rounded-md border text-sm ${
            txResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {txResult.success ? (
            <>
              <p className="font-semibold">✅ Transaction Successful</p>
              <p className="text-xs break-all mt-2">
                <span className="font-medium">Signature:</span> {txResult.signature}
              </p>
              <a
                className="text-blue-600 text-xs underline mt-2 inline-block"
                href={`https://explorer.solana.com/tx/${txResult.signature}?cluster=${CLUSTER}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Solana Explorer
              </a>
            </>
          ) : (
            <>
              <p className="font-semibold">❌ Transaction Failed</p>
              <p className="text-xs mt-1">{txResult.error}</p>
            </>
          )}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-4 text-sm text-gray-600 flex justify-center items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-b-2 border-blue-600 rounded-full"></div>
          <span>Waiting for transaction approval...</span>
        </div>
      )}
    </div>
  );
};

export default TransactionDemo;
