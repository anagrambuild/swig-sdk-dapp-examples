import React from "react";
import { Button, Tab, Tabs } from "@swig/ui";
import DefiEd25519 from "./DefiEd25519";
import SwigDashboard from "./SwigDashboard";
import SwigTokenDemo from "./SwigGasDemo";
import { useSwigContext } from "../../../context/SwigContext";
import DefiSecpPara from "./DefiSecpPara";
import BundledTransactions from "./BundledTransactions";

interface HomeContentProps {
  walletAddress: string;
  walletType: "SOLANA" | "EVM";
  setWalletType: (type: "SOLANA" | "EVM") => void;
  onLogout: () => Promise<void>;
  view: "defi_ed25519" | "swig" | "gas" | "defi_secp" | "bundled";
  setView: (view: "defi_ed25519" | "swig" | "gas" | "defi_secp" | "bundled") => void;
  handleWalletTypeChange: (type: "SOLANA" | "EVM") => void;
}

export const HomeContent: React.FC<HomeContentProps> = ({
  walletAddress,
  walletType,
  setWalletType,
  onLogout,
  view,
  setView,
  handleWalletTypeChange,
}) => {
  const { swigAddress } = useSwigContext();

  return (
    <div className="text-center flex flex-col gap-2 flex-grow w-full justify-between">
      <div className="flex flex-col gap-4">
        {/* Tabs + Wallet Type Selector */}
        <div className="flex flex-wrap justify-between items-center px-4">
          <Tabs>
            {walletType === "EVM" ? (
              <>
                <Tab isSelected={view === "swig"} onClick={() => setView("swig")}>
                  Swig Dashboard
                </Tab>
                <Tab isSelected={view === "defi_secp"} onClick={() => setView("defi_secp")}>
                  Transfer with EVM keys
                </Tab>
              </>
            ) : (
              <>
                <Tab isSelected={view === "swig"} onClick={() => setView("swig")}>
                  Swig Dashboard
                </Tab>
                <Tab isSelected={view === "defi_ed25519"} onClick={() => setView("defi_ed25519")}>
                  Transfer SOL
                </Tab>
                <Tab isSelected={view === "gas"} onClick={() => setView("gas")}>
                  Swig Gas Demo
                </Tab>
                <Tab isSelected={view === "bundled"} onClick={() => setView("bundled")}>
                  Bundled Transactions
                </Tab>
              </>
            )}
          </Tabs>

          {/* Wallet Type Dropdown - Only show if no Swig account exists */}
          {!swigAddress && (
            <div className="mt-2 sm:mt-0">
              <label htmlFor="walletType" className="sr-only">
                Wallet Type
              </label>
              <select
                id="walletType"
                value={walletType}
                onChange={(e) => handleWalletTypeChange(e.target.value as "SOLANA" | "EVM")}
                className="border border-gray-300 rounded p-1 text-sm"
              >
                <option value="SOLANA">Solana Wallet</option>
                <option value="EVM">EVM Wallet</option>
              </select>
            </div>
          )}
        </div>

        {walletAddress ? (
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-medium mb-2">You are logged in!</h2>
            <p>
              Your PARA wallet address is: <span className="font-mono">{walletAddress}</span>
            </p>
          </div>
        ) : (
          <p>No wallet found.</p>
        )}

        {/* View content */}
        {walletType === "EVM" ? (
          <>
            {view === "defi_secp" && (
              <DefiSecpPara walletAddress={walletAddress} setView={setView} />
            )}
            {view === "swig" && <SwigDashboard walletAddress={walletAddress} />}
          </>
        ) : (
          <>
            {view === "defi_ed25519" && (
              <DefiEd25519 walletAddress={walletAddress!} setView={setView} />
            )}
            {view === "swig" && <SwigDashboard walletAddress={walletAddress} />}
            {view === "gas" && <SwigTokenDemo />}
            {view === "bundled" && <BundledTransactions setView={setView} />}
          </>
        )}
      </div>
      <div className="flex flex-col gap-2 justify-center w-[50%] mx-auto">
        <Button variant="secondary" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
};
