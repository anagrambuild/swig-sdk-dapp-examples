import React from "react";
import { Button } from "@swig/ui";

export const CreateSwigButton: React.FC<{
  createSwigAccount: () => Promise<void>;
  loading: boolean;
}> = ({ createSwigAccount, loading }) => {
  return (
    <Button variant="primary" className="w-full" onClick={createSwigAccount} loading={loading}>
      Create Swig
    </Button>
  );
};
