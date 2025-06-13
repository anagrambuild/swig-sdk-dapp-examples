import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@swig/ui';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  PublicKey,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { TokenListProvider } from '@solana/spl-token-registry';
import { useWallet } from '../contexts/WalletContext';

const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const CLUSTER = 'devnet';
const SWIG_EXTENSION_ID = 'ngkjcjceookedgnmacgheeblecefegce';
const SOL_LOGO_URI = 'https://s3.coinmarketcap.com/static-gravity/image/5cc0b99a8dd84fbfa4e150d84b5531f2.png';

// Use a known valid devnet address (this is a common test address)
const DEFAULT_RECIPIENT = '11111111111111111111111111111112'; // System Program ID as fallback

const TransactionDemo: React.FC = () => {
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [txResult, setTxResult] = useState<{ signature: string; success: boolean; error?: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [selectedToken, setSelectedToken] = useState<any | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!publicKey) return;
    const connection = new Connection(SOLANA_RPC_URL);
    const pubkey = new PublicKey(publicKey);
    connection.getBalance(pubkey).then((lamports) => {
      setBalance(lamports / LAMPORTS_PER_SOL);
    });

    new TokenListProvider().resolve().then((tokenListContainer) => {
      const tokenList = tokenListContainer.filterByClusterSlug(CLUSTER).getList();
      connection.getParsedTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID }).then((result) => {
        const tokens = result.value.map(({ account }) => {
          const info = account.data.parsed.info;
          const mint = info.mint;
          const decimals = info.tokenAmount.decimals;
          const amount = parseFloat(info.tokenAmount.amount) / Math.pow(10, decimals);
          const metadata = tokenList.find((t) => t.address === mint);
          return {
            mint,
            decimals,
            amount,
            symbol: metadata?.symbol || 'UNKNOWN',
            name: metadata?.name || 'Unknown Token',
            logoURI: metadata?.logoURI,
          };
        });
        setTokens(tokens.filter(token => token.amount > 0)); // Only show tokens with balance
      });
    });
  }, [publicKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Validate public key helper
  const isValidPublicKey = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const sendTransaction = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !publicKey) return;
    
    // Validate recipient address
    if (!recipientAddress || !isValidPublicKey(recipientAddress)) {
      setTxResult({ 
        signature: '', 
        success: false, 
        error: 'Invalid recipient address. Please enter a valid Solana public key.' 
      });
      return;
    }

    setIsLoading(true);
    setTxResult(null);

    let popup: Window | null = null;

    try {
      const connection = new Connection(SOLANA_RPC_URL);
      const sender = new PublicKey(publicKey);
      const recipient = new PublicKey(recipientAddress);

      const transaction = new Transaction();
      transaction.feePayer = sender;

      if (selectedToken) {
        // Token transfer
        const mint = new PublicKey(selectedToken.mint);
        const amountToSend = Math.floor(parsedAmount * Math.pow(10, selectedToken.decimals));
        
        // Check if user has enough tokens
        if (amountToSend > selectedToken.amount * Math.pow(10, selectedToken.decimals)) {
          throw new Error(`Insufficient token balance. You have ${selectedToken.amount} ${selectedToken.symbol}`);
        }

        // Get associated token addresses with proper error handling
        let senderAta: PublicKey;
        let recipientAta: PublicKey;
        
        try {
          senderAta = await getAssociatedTokenAddress(
            mint, 
            sender, 
            true, // allowOwnerOffCurve = false (default)
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );
          
          recipientAta = await getAssociatedTokenAddress(
            mint, 
            recipient, 
            true, // allowOwnerOffCurve = false 
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );
        } catch (error) {
          console.error('Error getting associated token addresses:', error);
          throw new Error('Failed to calculate token account addresses. Please verify the recipient address.');
        }

        // Check if sender has the token account
        try {
          const senderAccount = await getAccount(connection, senderAta);
          if (senderAccount.amount < BigInt(amountToSend)) {
            throw new Error(`Insufficient token balance in account`);
          }
        } catch (error) {
          throw new Error(`You don't have a token account for ${selectedToken.symbol}`);
        }

        // Check if recipient needs an associated token account
        try {
          await getAccount(connection, recipientAta);
        } catch {
          // Recipient doesn't have the token account, need to create it
          transaction.add(
            createAssociatedTokenAccountInstruction(
              sender, // payer
              recipientAta, // associatedToken
              recipient, // owner
              mint, // mint
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }

        // Add transfer instruction
        transaction.add(
          createTransferInstruction(
            senderAta, // source
            recipientAta, // destination
            sender, // owner
            amountToSend, // amount
            [], // multiSigners (empty for single signature)
            TOKEN_PROGRAM_ID
          )
        );
      } else {
        // SOL transfer
        const lamports = Math.floor(parsedAmount * LAMPORTS_PER_SOL);
        
        // Check if user has enough SOL (including transaction fees)
        const minBalance = lamports + 5000; // 5000 lamports for transaction fee
        if (balance && balance * LAMPORTS_PER_SOL < minBalance) {
          throw new Error(`Insufficient SOL balance. You need at least ${minBalance / LAMPORTS_PER_SOL} SOL (including fees)`);
        }

        transaction.add(
          SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: recipient,
            lamports
          })
        );
      }

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      const serializedTx = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      const base64Tx = encodeURIComponent(serializedTx.toString('base64'));
      const requestId = crypto.randomUUID();

      const popupUrl = `chrome-extension://${SWIG_EXTENSION_ID}/index.html#/transaction-request?transaction=${base64Tx}&requestId=${requestId}`;
      popup = window.open(popupUrl, '_blank', 'width=400,height=600');

      if (!popup) throw new Error('Popup failed to open');

      // Listen for the extension's response
      const responsePromise = new Promise<{
        success: boolean;
        signature?: string;
        error?: string;
        cancelled?: boolean;
      }>((resolve, reject) => {
        const listener = (event: MessageEvent) => {
          const msg = event.data;
          if (msg && msg.source === 'swig-extension' && msg.requestId === requestId) {
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

      const response = await responsePromise;

      if (response.success && response.signature) {
        setTxResult({ signature: response.signature, success: true });
      } else if (response.cancelled) {
        setTxResult({ signature: '', success: false, error: 'Transaction was cancelled by the user.' });
      } else {
        throw new Error(response.error || 'Transaction failed');
      }
    } catch (e) {
      console.error('Transaction failed:', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      setTxResult({ signature: '', success: false, error: message });
    } finally {
      if (popup && !popup.closed) popup.close();
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-md mx-auto bg-white">
      <h2 className="text-2xl font-semibold text-center">Swig Transfer Demo</h2>
      
      {/* Token Selection */}
      <div ref={dropdownRef}>
        <label className="block text-sm font-medium">Token</label>
        <div className="relative">
          <button 
            type="button" 
            className="w-full px-4 py-2 border rounded-md flex items-center justify-between" 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="flex items-center">
              <img 
                src={selectedToken?.logoURI || SOL_LOGO_URI} 
                className="w-5 h-5 rounded-full" 
                alt="token logo"
              />
              <span className="ml-2">
                {selectedToken?.symbol || 'SOL'} ({selectedToken ? selectedToken.amount.toFixed(4) : balance?.toFixed(4) || '0'})
              </span>
            </div>
            <span className="text-gray-400">▼</span>
          </button>
          {showDropdown && (
            <div className="absolute w-full mt-1 bg-white border rounded-md shadow max-h-64 overflow-auto z-10">
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center" 
                onClick={() => { setSelectedToken(null); setShowDropdown(false); }}
              >
                <img src={SOL_LOGO_URI} className="w-5 h-5 rounded-full" alt="SOL" />
                <span className="ml-2">SOL ({balance?.toFixed(4) || '0'})</span>
              </div>
              {tokens.map(token => (
                <div 
                  key={token.mint} 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center" 
                  onClick={() => { setSelectedToken(token); setShowDropdown(false); }}
                >
                  {token.logoURI && (
                    <img src={token.logoURI} className="w-5 h-5 rounded-full" alt={token.symbol} />
                  )}
                  <span className="ml-2">{token.symbol} ({token.amount.toFixed(4)})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recipient Address */}
      <div>
        <label className="block text-sm font-medium">Recipient Address</label>
        <input 
          type="text" 
          value={recipientAddress} 
          onChange={e => setRecipientAddress(e.target.value)}
          placeholder="Enter Solana public key address"
          disabled={isLoading} 
          className="w-full px-4 py-2 border rounded-md font-mono text-sm" 
        />
        {recipientAddress && !isValidPublicKey(recipientAddress) && (
          <p className="text-red-600 text-xs mt-1">Invalid public key format</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium">Amount</label>
        <input 
          type="number" 
          step="0.0001" 
          min="0" 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          disabled={isLoading} 
          className="w-full px-4 py-2 border rounded-md" 
        />
      </div>

      <Button 
        disabled={
          isLoading || 
          !publicKey || 
          !amount || 
          !recipientAddress || 
          !isValidPublicKey(recipientAddress)
        } 
        onClick={sendTransaction} 
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Send Transaction'}
      </Button>

      {/* Transaction Result */}
      {txResult && (
        <div className={`p-4 rounded-md border text-sm ${
          txResult.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {txResult.success ? (
            <>
              ✅ Transaction Successful
              <div className="text-xs mt-2 break-all">
                <span className="font-medium">Signature:</span> {txResult.signature}
              </div>
              <a
                href={`https://explorer.solana.com/tx/${txResult.signature}?cluster=${CLUSTER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-xs underline mt-1 inline-block"
              >
                View on Solana Explorer
              </a>
            </>
          ) : (
            <>❌ Transaction Failed: {txResult.error}</>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionDemo;