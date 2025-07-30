import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { Button } from "@swig/ui";

interface LegacyTransactionDemoProps {
  publicKey: string;
}

const LegacyTransactionDemo: React.FC<LegacyTransactionDemoProps> = ({ publicKey }) => {
  const { connection } = useConnection();
  const { wallet } = useWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const getBalance = async () => {
    try {
      const pubKey = new PublicKey(publicKey);
      const bal = await connection.getBalance(pubKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (err) {
      setTxResult(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (publicKey) getBalance();
  }, [publicKey]);

  const sendSolTransaction = async () => {
    const adapter = wallet?.adapter;

    if (!adapter?.publicKey || !("signTransaction" in adapter)) {
      setTxResult("Wallet not connected or does not support transaction signing.");
      return;
    }

    const signerAdapter = adapter as SignerWalletAdapter;

    if (!recipient || !amount) {
      setTxResult("Please enter both recipient address and amount.");
      return;
    }

    setIsLoading(true);
    try {
      const toPubkey = new PublicKey(recipient);
      const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      if (isNaN(lamports) || lamports <= 0) throw new Error("Invalid amount");

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      const ix = SystemProgram.transfer({
        fromPubkey: adapter.publicKey,
        toPubkey,
        lamports,
      });

      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: adapter.publicKey,
      }).add(ix);

      const signedTx = await signerAdapter.signTransaction(tx);
      const txid = await connection.sendRawTransaction(signedTx.serialize());

      await connection.confirmTransaction(
        { signature: txid, blockhash, lastValidBlockHeight },
        "processed"
      );

      setTxResult(`✅ Transfer successful! Signature: ${txid}`);
      setTimeout(getBalance, 1000);
    } catch (err) {
      setTxResult(`❌ Transaction failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const requestAirdrop = async () => {
    if (!wallet?.adapter?.publicKey) {
      setTxResult("Wallet not connected");
      return;
    }

    setIsLoading(true);
    try {
      const signature = await connection.requestAirdrop(wallet.adapter.publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature, "processed");
      setTxResult(`✅ Airdrop successful! Signature: ${signature}`);
      setTimeout(getBalance, 2000);
    } catch (err) {
      setTxResult(`❌ Airdrop failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-medium text-gray-900">Legacy Transaction Demo</h2>
      <p className="mt-2 text-sm text-gray-600">
        Send SOL to any address using legacy transaction logic (v1).
      </p>

      {balance !== null && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Balance:</strong> {balance.toFixed(4)} SOL
          </p>
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter wallet address"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Amount (SOL)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.01"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
            min="0"
            step="0.0001"
          />
        </div>

        <Button onClick={requestAirdrop} disabled={isLoading}>
          {isLoading ? "Processing..." : "Request Airdrop (1 SOL)"}
        </Button>

        <Button onClick={sendSolTransaction} disabled={isLoading} variant="secondary">
          {isLoading ? "Sending..." : "Send SOL"}
        </Button>

        {txResult && (
          <div className="mt-4 p-4 border rounded bg-gray-50 text-sm break-all">{txResult}</div>
        )}
      </div>
    </div>
  );
};

export default LegacyTransactionDemo;
