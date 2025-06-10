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
      }>((resolve) => {
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
            } else {
              resolve({ success: false, error: 'Unexpected message action' });
            }
          }
        };

        window.addEventListener('message', listener);
      });

      const popupUrl = `chrome-extension://${SWIG_EXTENSION_ID}/index.html#/transaction-request?transaction=${base64Tx}&requestId=${requestId}`;
      window.open(popupUrl, '_blank', 'width=400,height=600');

      const response = await responsePromise;

      if (response.success && response.signature) {
        setTxResult({ signature: response.signature, success: true });
      } else if (response.cancelled) {
        setTxResult({ signature: '', success: false });
        alert('Transaction was cancelled by the user.');
      } else {
        throw new Error(response.error || 'Unknown error or signature missing');
      }
    } catch (e) {
      console.error(e);
      setTxResult({ signature: '', success: false });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Swig Transfer Demo</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount (in SOL)
        </label>
        <input
          type="number"
          step="0.0001"
          min="0"
          placeholder="e.g. 0.05"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
      </div>

      <Button disabled={isLoading} onClick={sendTransaction}>
        {isLoading ? 'Sending...' : 'Send Test Transaction'}
      </Button>

      {recipientAddress && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Recipient Address:</span>{' '}
          <span className="break-all">{recipientAddress}</span>
        </div>
      )}

      {txResult && (
        <div className={`p-4 rounded border ${
          txResult.success ? 'bg-green-50' : 'bg-red-50'
        }`}>
          {txResult.success ? (
            <>
              <p className="text-green-800 font-semibold">Transaction Submitted</p>
              <p className="text-green-700 text-xs break-all">Signature: {txResult.signature}</p>
              <a
                className="text-blue-600 text-sm mt-1 inline-block underline"
                href={`https://explorer.solana.com/tx/${txResult.signature}?cluster=${CLUSTER}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Solana Explorer
              </a>
            </>
          ) : (
            <p className="text-red-800 font-semibold">Transaction Failed or Cancelled. Check console.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionDemo;
