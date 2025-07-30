import React, { FC, useEffect } from "react";
import { WalletButton } from "./SolanaProvider";
import { useWallet } from "@solana/wallet-adapter-react";

interface LegacyWalletConnectProps {
  onConnect: (publicKey: string) => void;
  onDisconnect: () => void;
}

const LegacyWalletConnect: FC<LegacyWalletConnectProps> = ({
  onConnect,
  onDisconnect,
}) => {
  const { publicKey, connected, disconnect } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      onConnect(publicKey.toBase58());
    } else {
      onDisconnect();
    }
  }, [connected, publicKey]);

  return (
    <div>
      <h2 className="text-xl font-medium text-gray-900 mb-4">Wallet Connection</h2>
      <p className="text-sm text-gray-600 mb-4">
        Connect your Solana wallet to interact with this dApp using legacy wallet adapter methods.
      </p>

      <div className="flex gap-4 items-center">
        {!connected ? (
          <WalletButton className="!bg-blue-600 !hover:bg-blue-700" />
        ) : (
          <div className="flex gap-4 items-center">
            <div className="text-sm text-green-600 font-medium">✓ Connected</div>
            <WalletButton className="!bg-red-600 !hover:bg-red-700" onClick={disconnect} />
          </div>
        )}
      </div>

      {connected && publicKey && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800">
            <strong>Wallet Address:</strong>
          </p>
          <p className="text-xs text-green-700 font-mono break-all mt-1">
            {publicKey.toBase58()}
          </p>
        </div>
      )}
    </div>
  );
};

export default LegacyWalletConnect;