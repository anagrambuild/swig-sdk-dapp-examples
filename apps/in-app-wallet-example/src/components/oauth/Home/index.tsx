import React, { useEffect, useState } from "react";
import { SwigProvider } from "../../../context/SwigContext";
import { HomeContent } from "./HomeContent";

interface HomeProps {
  walletAddress: string;
  walletType: "SOLANA" | "EVM";
  setWalletType: (type: "SOLANA" | "EVM") => void;
  onLogout: () => Promise<void>;
}

export const Home: React.FC<HomeProps> = ({
  walletAddress,
  walletType,
  setWalletType,
  onLogout,
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

  return (
    <SwigProvider walletAddress={walletAddress} walletType={walletType}>
      <HomeContent
        walletAddress={walletAddress}
        walletType={walletType}
        setWalletType={setWalletType}
        onLogout={onLogout}
        view={view}
        setView={setView}
        handleWalletTypeChange={handleWalletTypeChange}
      />
    </SwigProvider>
  );
};
