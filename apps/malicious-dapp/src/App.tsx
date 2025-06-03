import React from "react";
import Malicious from "./components/Malicious";
import { WalletProvider } from "./contexts/WalletContext";

const App: React.FC = () => {
  return (
    <WalletProvider>
      <Malicious />
    </WalletProvider>
  );
};

export default App;
