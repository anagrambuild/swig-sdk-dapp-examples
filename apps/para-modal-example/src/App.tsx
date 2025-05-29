import React from "react";
import { Providers } from "./providers";
import { AppContent } from "./components/AppContent";

const App = () => {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
};

export default App;
