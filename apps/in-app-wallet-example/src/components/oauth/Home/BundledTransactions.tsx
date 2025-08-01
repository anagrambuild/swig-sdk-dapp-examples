import React, { useState, useEffect } from "react";
import { Button, Select } from "@swig/ui";
import { useSwigContext } from "../../../context/SwigContext";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { signTransaction } from "../../../utils/swig/transactions";

interface BundledTransactionsProps {
  setView: (view: "defi_ed25519" | "swig" | "gas" | "bundled") => void;
}

// Default recipient addresses (can be removed in production)
const DEFAULT_RECIPIENT_1 = "BKV7zy1Q74pyk3eehMrVQeau9pj2kEp6k36RZwFTFdHk";
const DEFAULT_RECIPIENT_2 = "HaN2KEjyMxHsgCUBXjW3ahyqHD5dyuULd4tEPBbwZx4S";

const BundledTransactions: React.FC<BundledTransactionsProps> = ({ setView }) => {
  const { roles, swigAddress, getConnection } = useSwigContext();

  // Role selection state
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [roleLimit, setRoleLimit] = useState<number | null>(null);

  // Transaction configuration state
  const [recipient1, setRecipient1] = useState<string>(DEFAULT_RECIPIENT_1);
  const [recipient2, setRecipient2] = useState<string>(DEFAULT_RECIPIENT_2);
  const [amount1, setAmount1] = useState<string>("0.1");
  const [amount2, setAmount2] = useState<string>("0.1");

  // Wallet state
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Error states
  const [clientError, setClientError] = useState<string | null>(null);
  const [tx1Error, setTx1Error] = useState<string | null>(null);
  const [tx2Error, setTx2Error] = useState<string | null>(null);

  // Transaction signatures
  const [tx1Signature, setTx1Signature] = useState<string | null>(null);
  const [tx2Signature, setTx2Signature] = useState<string | null>(null);

  // Success states
  const [tx1Success, setTx1Success] = useState<boolean | null>(null);
  const [tx2Success, setTx2Success] = useState<boolean | null>(null);

  // Create an array of role options for the dropdown
  const roleOptions = roles.map((role, index) => ({
    value: index.toString(),
    label: role.name || `Role ${index + 1}`,
  }));

  // Get wallet balance and role limit when role selected or transactions complete
  useEffect(() => {
    const fetchBalanceAndLimit = async () => {
      if (swigAddress && selectedRole) {
        try {
          const connection = await getConnection();

          // Get wallet balance
          const balanceInLamports = await connection.getBalance(new PublicKey(swigAddress));
          const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
          setWalletBalance(balanceInSol);

          // Get the selected role's SOL limit
          const role = roles[parseInt(selectedRole)];
          if (role?.actions?.canSpendSol?.()) {
            const limit = role.actions.solSpendLimit();
            setRoleLimit(limit === null ? null : Number(limit) / LAMPORTS_PER_SOL);
          } else {
            setRoleLimit(null);
          }
        } catch (error) {
          console.error("Error fetching balance or role limit:", error);
        }
      } else {
        setWalletBalance(null);
        setRoleLimit(null);
      }
    };

    fetchBalanceAndLimit();
  }, [swigAddress, selectedRole, roles, isProcessing]);

  // Calculate total transaction amount
  const totalAmount = (amount1 ? parseFloat(amount1) : 0) + (amount2 ? parseFloat(amount2) : 0);

  // Helper function to get explorer URL
  const getExplorerUrl = (signature: string): string => {
    const baseUrl = "https://explorer.solana.com";
    const network = localStorage.getItem("swig_network") || "localnet";
  
    if (network === "devnet") {
      return `${baseUrl}/tx/${signature}?cluster=devnet`;
    }
    // Default to localnet
    const encodedLocalhost = encodeURIComponent("http://localhost:8899");
    return `${baseUrl}/tx/${signature}?cluster=custom&customUrl=${encodedLocalhost}`;
  };

  // Handle form submission and execute transactions
  const handleExecuteTransactions = async () => {
    // Clear previous states
    setClientError(null);
    setTx1Error(null);
    setTx2Error(null);
    setTx1Signature(null);
    setTx2Signature(null);
    setTx1Success(null);
    setTx2Success(null);

    if (!swigAddress) {
      setClientError("No Swig address found");
      return;
    }

    // Client-side validations
    if (!selectedRole) {
      setClientError("Please select a role");
      return;
    }

    if (!recipient1 || !recipient2) {
      setClientError("Please enter both recipient addresses");
      return;
    }

    if (!amount1 || !amount2 || parseFloat(amount1) <= 0 || parseFloat(amount2) <= 0) {
      setClientError("Please enter valid amounts for both transactions");
      return;
    }

    const role = roles[parseInt(selectedRole)];

    // Check if role can spend SOL
    if (!role?.actions?.canSpendSol?.()) {
      setClientError("Selected role does not have permission to spend SOL");
      // return;
    }

    // Check total amount against role limit
    if (roleLimit !== null && totalAmount > roleLimit) {
      setClientError(
        `Total amount (${totalAmount} SOL) exceeds role's spending limit of ${roleLimit.toFixed(
          4
        )} SOL`
      );
      return;
    }

    // Check total amount against wallet balance
    if (walletBalance !== null && totalAmount > walletBalance) {
      setClientError(
        `Total amount (${totalAmount} SOL) exceeds wallet balance of ${walletBalance.toFixed(
          4
        )} SOL`
      );
      return;
    }

    setIsProcessing(true);

    try {
      const connection = await getConnection();

      // Get the role keypair from localStorage
      const roleKeypairSecret =
        localStorage.getItem(`rootKeypair_${selectedRole}`) ||
        localStorage.getItem(`roleKeypair_${selectedRole}`);
      if (!roleKeypairSecret) {
        setClientError(
          `Role keypair not found for role ${selectedRole}. This role may have been created before keypair storage was implemented. Please recreate the role.`
        );
        setIsProcessing(false);
        return;
      }
      const roleKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(roleKeypairSecret)));

      // Execute first transaction
      try {
        const transfer1Ix = SystemProgram.transfer({
          fromPubkey: new PublicKey(swigAddress),
          toPubkey: new PublicKey(recipient1),
          lamports: parseFloat(amount1) * LAMPORTS_PER_SOL,
        });

        const signature1 = await signTransaction(
          connection,
          new PublicKey(swigAddress),
          roleKeypair.publicKey,
          roleKeypair,
          [transfer1Ix]
        );

        setTx1Signature(signature1);
        setTx1Success(true);
      } catch (error) {
        console.error("Transaction 1 failed:", error);
        setTx1Error((error as Error).message);
        setTx1Success(false);
      }

      // Execute second transaction
      try {
        const transfer2Ix = SystemProgram.transfer({
          fromPubkey: new PublicKey(swigAddress),
          toPubkey: new PublicKey(recipient2),
          lamports: parseFloat(amount2) * LAMPORTS_PER_SOL,
        });

        const signature2 = await signTransaction(
          connection,
          new PublicKey(swigAddress),
          roleKeypair.publicKey,
          roleKeypair,
          [transfer2Ix]
        );

        setTx2Signature(signature2);
        setTx2Success(true);
      } catch (error) {
        console.error("Transaction 2 failed:", error);
        setTx2Error((error as Error).message);
        setTx2Success(false);
      }
    } catch (error) {
      console.error("Bundle execution failed:", error);
      setClientError((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col w-2xl mx-auto gap-4 mt-4">
      <h2 className="text-xl font-medium mb-2">Bundled Transactions</h2>
      <p className="text-gray-600 mb-4">
        Execute multiple transactions with a single approval using Swig roles.
      </p>

      {swigAddress && roles.length > 0 ? (
        <>
          {/* Role Selection */}
          <div className="p-4 border rounded shadow-sm bg-gray-50">
            <h3 className="text-lg font-medium mb-2">1. Select Role</h3>
            <Select
              value={selectedRole}
              onChange={(value) => setSelectedRole(value as string)}
              options={roleOptions}
              placeholder="Select a role with SOL spending permission"
            />

            {selectedRole && (
              <div className="mt-3">
                <h4 className="font-medium">Selected Role Details</h4>
                <p>Role Name: {roles[parseInt(selectedRole)].name}</p>
                <p>
                  Can Spend SOL:{" "}
                  {roles[parseInt(selectedRole)]?.actions?.canSpendSol?.() === true ? "Yes" : "No"}
                </p>
                {roleLimit !== null && (
                  <p className="mt-1 text-blue-600">Spending Limit: {roleLimit.toFixed(4)} SOL</p>
                )}
              </div>
            )}

            {walletBalance !== null && (
              <p className="mt-2 text-gray-600">Wallet Balance: {walletBalance.toFixed(4)} SOL</p>
            )}
          </div>

          {/* Transaction Configuration */}
          <div className="p-4 border rounded shadow-sm">
            <h3 className="text-lg font-medium mb-2">2. Configure Transactions</h3>

            {/* First Transaction */}
            <div className="mb-4 p-3 border rounded bg-blue-50">
              <h4 className="font-medium mb-2">Transaction 1</h4>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Recipient Address</label>
                <input
                  type="text"
                  value={recipient1}
                  onChange={(e) => setRecipient1(e.target.value)}
                  placeholder="Enter recipient address"
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Amount (SOL)</label>
                  <input
                    type="number"
                    value={amount1}
                    onChange={(e) => setAmount1(e.target.value)}
                    placeholder="0.01"
                    min="0"
                    step="0.001"
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Second Transaction */}
            <div className="mb-4 p-3 border rounded bg-purple-50">
              <h4 className="font-medium mb-2">Transaction 2</h4>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Recipient Address</label>
                <input
                  type="text"
                  value={recipient2}
                  onChange={(e) => setRecipient2(e.target.value)}
                  placeholder="Enter recipient address"
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Amount (SOL)</label>
                  <input
                    type="number"
                    value={amount2}
                    onChange={(e) => setAmount2(e.target.value)}
                    placeholder="0.01"
                    min="0"
                    step="0.001"
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            {amount1 && amount2 && (
              <div className="mb-4 p-3 border rounded bg-gray-50">
                <h4 className="font-medium mb-1">Transaction Summary</h4>
                <p className="text-lg font-semibold text-blue-600">
                  Total: {totalAmount.toFixed(4)} SOL
                </p>
                {roleLimit !== null && totalAmount > roleLimit && (
                  <p className="text-sm text-red-600 mt-1">
                    Warning: Total exceeds role's spending limit
                  </p>
                )}
                {walletBalance !== null && totalAmount > walletBalance && (
                  <p className="text-sm text-red-600 mt-1">Warning: Total exceeds wallet balance</p>
                )}
              </div>
            )}
          </div>

          {/* Execute Button */}
          <Button
            variant="primary"
            onClick={handleExecuteTransactions}
            disabled={
              !selectedRole ||
              !recipient1 ||
              !recipient2 ||
              !amount1 ||
              !amount2 ||
              totalAmount <= 0 ||
              isProcessing
            }
            className="py-3"
          >
            {isProcessing ? "Processing..." : "Execute Bundled Transactions"}
          </Button>

          {/* Error Display */}
          {clientError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-medium text-red-800">Error:</p>
              <p className="text-sm text-red-600">{clientError}</p>
            </div>
          )}

          {/* Results Display */}
          {(tx1Signature || tx2Signature) && (
            <div className="p-4 border rounded shadow-sm mt-4">
              <h3 className="text-lg font-medium mb-3">Transaction Results</h3>

              {/* Transaction 1 Result */}
              {tx1Signature && (
                <div
                  className={`p-3 border rounded-md mb-3 ${
                    tx1Success === true
                      ? "bg-green-50 border-green-200"
                      : tx1Success === false
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Transaction 1</h4>
                    <span
                      className={`text-sm font-medium ${
                        tx1Success === true
                          ? "text-green-600"
                          : tx1Success === false
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {tx1Success === true
                        ? "Success"
                        : tx1Success === false
                        ? "Failed"
                        : "Pending"}
                    </span>
                  </div>
                  <a
                    href={getExplorerUrl(tx1Signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline block mt-1"
                  >
                    View transaction on Solana Explorer
                  </a>
                  {tx1Error && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-800">Error:</p>
                      <p className="text-sm text-red-600">{tx1Error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction 2 Result */}
              {tx2Signature && (
                <div
                  className={`p-3 border rounded-md ${
                    tx2Success === true
                      ? "bg-green-50 border-green-200"
                      : tx2Success === false
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Transaction 2</h4>
                    <span
                      className={`text-sm font-medium ${
                        tx2Success === true
                          ? "text-green-600"
                          : tx2Success === false
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {tx2Success === true
                        ? "Success"
                        : tx2Success === false
                        ? "Failed"
                        : "Pending"}
                    </span>
                  </div>
                  <a
                    href={getExplorerUrl(tx2Signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline block mt-1"
                  >
                    View transaction on Solana Explorer
                  </a>
                  {tx2Error && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-800">Error:</p>
                      <p className="text-sm text-red-600">{tx2Error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Overall Status */}
              {tx1Success !== null && tx2Success !== null && (
                <div
                  className={`p-3 border rounded-md mt-3 ${
                    tx1Success && tx2Success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <p
                    className={`text-base font-medium ${
                      tx1Success && tx2Success ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {tx1Success && tx2Success
                      ? "All transactions completed successfully!"
                      : "Some transactions failed. Check details above."}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2 justify-center mx-auto">
          <p>No roles found. Please create a swig wallet first.</p>
          <Button variant="primary" onClick={() => setView("swig")}>
            Go to Swig Dashboard
          </Button>
        </div>
      )}
    </div>
  );
};

export default BundledTransactions;
