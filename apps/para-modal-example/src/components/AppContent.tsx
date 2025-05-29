import React, { useState, useEffect } from "react";
import { useAccount, useWallet, useClient } from "@getpara/react-sdk";
import { ParaSolanaWeb3Signer } from "@getpara/solana-web3.js-v1-integration";
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { Actions, Swig, findSwigPda, createEd25519AuthorityInfo } from "@swig-wallet/classic";
import { LoginButton } from "./LoginButton";
import { CreateSwigButton } from "./CreateSwigButton";

export const AppContent: React.FC = () => {
  const { data: account } = useAccount();
  const { data: wallet } = useWallet();

  const [swigAddress, setSwigAddress] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isCreatingSwig, setIsCreatingSwig] = useState(false);

  const para = useClient();

  const connection = new Connection("https://api.devnet.solana.com");

  const createSwigAccount = async () => {
    if (!wallet?.address || !para) return;
    setIsCreatingSwig(true);

    try {
      // 1. Generate random ID for the Swig account
      const id = new Uint8Array(32);
      crypto.getRandomValues(id);

      const paraPubkey = new PublicKey(wallet.address);
      const [swigPdaAddress] = findSwigPda(id);

      // 2. Create Para Solana signer
      const signer = new ParaSolanaWeb3Signer(para, connection, wallet.id);

      // 3. Create root authority info
      const rootAuthorityInfo = createEd25519AuthorityInfo(paraPubkey);

      // 4. Set up actions
      const rootActions = Actions.set().all().get();

      // 5. Create the Swig creation instruction
      const createSwigInstruction = Swig.create({
        authorityInfo: rootAuthorityInfo,
        id,
        payer: paraPubkey,
        actions: rootActions,
      });

      // 6. Build transaction
      const transaction = new Transaction();
      transaction.add(createSwigInstruction);
      transaction.feePayer = paraPubkey;

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // 7. Sign transaction using Para's Solana signer
      const signedTransaction = await signer.signTransaction(transaction);

      // 8. Send the signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      // 9. Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
      });

      setSwigAddress(swigPdaAddress.toBase58());
      setIsCreatingSwig(false);

      console.log("Swig account created successfully!");
      console.log("Swig address:", swigPdaAddress.toBase58());
      console.log("Transaction signature:", signature);
    } catch (error) {
      console.error("Error in transaction signing:", error);
      setIsCreatingSwig(false);
    }
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet?.address) {
        try {
          const balance = await connection.getBalance(new PublicKey(wallet.address));
          setSolBalance(balance / LAMPORTS_PER_SOL);
        } catch (e) {
          setSolBalance(null);
        }
      }
    };
    fetchBalance();
  }, [wallet?.address]);

  return (
    <div className="min-h-screen flex justify-center p-4">
      <div className="max-w-md w-full space-y-6 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Para Solana Web3.js Example</h2>
          <p className="mt-2 text-sm text-gray-600">
            Using Para's Solana Web3.js integration for transaction signing
          </p>
        </div>
        {account?.isConnected && wallet && (
          <div className="text-center mb-4">
            <p className="text-green-700 font-medium">You are signed in!</p>
            <p className="text-sm text-gray-700">
              Wallet address:{" "}
              <span className="font-mono break-all">
                {para
                  ? para.getDisplayAddress(wallet.id, { truncate: false, addressType: wallet.type })
                  : wallet.id}
              </span>
            </p>
            {solBalance !== null && (
              <p className="text-sm text-gray-700">
                Balance: <span className="font-mono">{solBalance} SOL</span>
              </p>
            )}
            {swigAddress && (
              <p className="text-sm text-gray-700">
                Swig address: <span className="font-mono break-all">{swigAddress}</span>
              </p>
            )}
          </div>
        )}
        <div className="flex justify-center">
          <div className="w-full max-w-xs gap-4 flex flex-col">
            {account?.isConnected && (
              <CreateSwigButton createSwigAccount={createSwigAccount} loading={isCreatingSwig} />
            )}
            <LoginButton />
          </div>
        </div>
      </div>
    </div>
  );
};
