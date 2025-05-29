import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Environment, ParaProvider } from "@getpara/react-sdk";
import "@getpara/react-sdk/styles.css";

const queryClient = new QueryClient();

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ParaProvider
        paraClientConfig={{
          apiKey: import.meta.env.VITE_PARA_API_KEY || "",
          env: Environment.BETA,
        }}
      >
        {children}
      </ParaProvider>
    </QueryClientProvider>
  );
}
