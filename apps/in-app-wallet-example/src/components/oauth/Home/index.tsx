import React from "react";
import { useState } from "react";
import { Tab, Tabs } from "@swig/ui";
import Defi from "./Defi";
import SwigDashboard from "./SwigDashboard";
import SwigTokenDemo from "./SwigGasDemo";
import BundledTransactions from "./BundledTransactions";
import { SwigProvider } from "../../../context/SwigContext";

interface HomeProps {
  walletAddress?: string;
  onLogout: () => Promise<void>;
}

export const Home: React.FC<HomeProps> = ({ walletAddress, onLogout }) => {
  const [view, setView] = useState<"home" | "swig" | "gas" | "bundled">("home");

  return (
    <SwigProvider walletAddress={walletAddress!}>
      <div className="text-center flex flex-col gap-2 flex-grow w-full">
        <Tabs>
          <Tab isSelected={view === "home"} onClick={() => setView("home")}>
            Home
          </Tab>
          <Tab isSelected={view === "swig"} onClick={() => setView("swig")}>
            Swig Dashboard
          </Tab>
          <Tab isSelected={view === "gas"} onClick={() => setView("gas")}>
            Swig Gas Demo
          </Tab>
          <Tab isSelected={view === "bundled"} onClick={() => setView("bundled")}>
            Bundled Transactions Demo
          </Tab>
        </Tabs>
        {view === "home" && (
          <Defi walletAddress={walletAddress!} onLogout={onLogout} setView={setView} />
        )}
        {view === "swig" && <SwigDashboard walletAddress={walletAddress!} />}
        {view === "gas" && <SwigTokenDemo />}
        {view === "bundled" && <BundledTransactions setView={setView} />}
      </div>
    </SwigProvider>
  );
};
