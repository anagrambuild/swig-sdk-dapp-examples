import React, { createContext, useContext, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet as useSolanaWallet,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection } from "@solana/web3.js";

interface WalletContextType {
  wallets: any[];
  selectedWallet: any | null;
  publicKey: string | null;
  connecting: boolean;
  connected: boolean;
  connectWallet: (wallet: any) => Promise<void>;
  disconnectWallet: () => void;
  signAndSendTransaction: (transaction: any, connection: Connection) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={[]} autoConnect>
        <WalletContextWrapper>{children}</WalletContextWrapper>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

const WalletContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    wallets,
    wallet: selectedWallet,
    publicKey,
    connecting,
    connected,
    select,
    disconnect,
    signTransaction,
    signAllTransactions,
    sendTransaction,
  } = useSolanaWallet();

  // Convert publicKey to string if it exists
  const publicKeyString = publicKey ? publicKey.toString() : null;

  const connectWallet = async (wallet: any) => {
    try {
      select(wallet.adapter.name);
      // Note: The wallet adapter will handle the connection process
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    try {
      disconnect();
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const signAndSendTransaction = async (transaction: any, connection: Connection) => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      const signature = await sendTransaction(transaction, connection);
      return signature;
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  };

  const contextValue = {
    wallets,
    selectedWallet,
    publicKey: publicKeyString,
    connecting,
    connected,
    connectWallet,
    disconnectWallet,
    signAndSendTransaction,
  };

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
