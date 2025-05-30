import React from "react";
import { Button } from "@swig/ui";

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Malicious DApp Example</h1>
          <p className="mt-2 text-sm text-gray-600">
            This is a demonstration of malicious dapp patterns
          </p>
        </div>
        <Button>Click me</Button>
      </div>
    </div>
  );
};

export default App;
