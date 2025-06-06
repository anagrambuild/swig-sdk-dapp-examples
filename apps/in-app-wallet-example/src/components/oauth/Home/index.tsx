import React, { useEffect, useState } from "react";
import { SwigProvider } from "../../../context/SwigContext";
import { HomeContent } from "./HomeContent";

interface HomeProps {
  walletAddress: string;
  walletType: "SOLANA" | "EVM";
  setWalletType: (type: "SOLANA" | "EVM") => void;
  network: "localnet" | "devnet";
  setNetwork: (network: "localnet" | "devnet") => void;
  onLogout: () => Promise<void>;
}

export const Home: React.FC<HomeProps> = ({
  walletAddress,
  walletType,
  setWalletType,
  onLogout,
  network,
  setNetwork,
}) => {
  const [view, setView] = useState<"defi_ed25519" | "swig" | "gas" | "defi_secp" | "bundled">(
    "swig"
  );

  // Load wallet type from localStorage on mount
  useEffect(() => {
    const storedType = localStorage.getItem("walletType");
    if (storedType === "SOLANA" || storedType === "EVM") {
      setWalletType(storedType);
    }
  }, [setWalletType]);

  // Save to localStorage on user selection
  const handleWalletTypeChange = (type: "SOLANA" | "EVM") => {
    localStorage.setItem("walletType", type);
    setWalletType(type);
  };

  // Handle network change
  const handleNetworkChange = (network: "localnet" | "devnet") => {
    localStorage.setItem("swig_network", network);
    console.log("Network changed to:", network);
    setNetwork(network);
  };

  return (
    <SwigProvider walletAddress={walletAddress} walletType={walletType}>
      <div className="flex justify-end w-full">
        <a
          href="https://github.com/anagrambuild/swig-sdk-dapp-examples/tree/main/apps/in-app-wallet-example"
          target="_blank"
          className="text-sm text-blue-500 hover:text-blue-700"
        >
          View on Github
        </a>
      </div>
      <HomeContent
        walletAddress={walletAddress}
        walletType={walletType}
        setWalletType={setWalletType}
        network={network}
        setNetwork={setNetwork}
        handleNetworkChange={handleNetworkChange}
        onLogout={onLogout}
        view={view}
        setView={setView}
        handleWalletTypeChange={handleWalletTypeChange}
      />
    </SwigProvider>
  );
};
