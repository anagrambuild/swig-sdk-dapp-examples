import { Button, Select } from "@swig/ui";
import { useSwigContext } from "../../../context/SwigContext";
import { useState, useEffect } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { signTransaction } from "../../../utils/swig/transactions";
import { Ed25519Authority, fetchSwig } from "@swig-wallet/classic";

interface DefiProps {
  walletAddress?: string;
  onLogout: () => Promise<void>;
  setView: (view: "home" | "swig" | "gas" | "bundled") => void;
}

const RECIPIENT_ADDRESS = "BKV7zy1Q74pyk3eehMrVQeau9pj2kEp6k36RZwFTFdHk";

const Defi: React.FC<DefiProps> = ({ walletAddress, onLogout, setView }) => {
  const { roles, swigAddress } = useSwigContext();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [solAmount, setSolAmount] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [roleLimit, setRoleLimit] = useState<number | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const roleOptions = roles.map((role, index) => ({
    value: index.toString(),
    label: role.name || `Role ${index + 1}`,
  }));

  useEffect(() => {
    const fetchBalanceAndLimit = async () => {
      if (swigAddress && selectedRole) {
        try {
          const connection = new Connection("http://localhost:8899", "confirmed");
          const balanceInLamports = await connection.getBalance(new PublicKey(swigAddress));
          const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
          setWalletBalance(balanceInSol);

          // Get the selected role's SOL limit
          const role = roles[parseInt(selectedRole)];
          if (role?.canSpendSol?.()) {
            let left = BigInt(0);
            let right = BigInt(100 * LAMPORTS_PER_SOL);
            let maxLamports = BigInt(0);

            while (left <= right) {
              const mid = (left + right) / BigInt(2);
              if (role.canSpendSol(mid)) {
                maxLamports = mid;
                left = mid + BigInt(1);
              } else {
                right = mid - BigInt(1);
              }
            }

            const maxSolAmount = Number(maxLamports) / LAMPORTS_PER_SOL;
            setRoleLimit(maxSolAmount);
          } else {
            setRoleLimit(null);
          }
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      } else {
        setWalletBalance(null);
        setRoleLimit(null);
      }
    };

    fetchBalanceAndLimit();
  }, [swigAddress, selectedRole, roles, isTransferring]);

  const handleTransfer = async () => {
    // Clear all previous errors and transaction results
    setClientError(null);
    setSdkError(null);
    setTxSignature(null);

    if (!selectedRole || !solAmount || !swigAddress) {
      setClientError("Please select a role and enter an amount");
      return; // Keep this return as it's a required field check
    }

    const role = roles[parseInt(selectedRole)];
    const amountInLamports = Number(solAmount) * LAMPORTS_PER_SOL;

    // Client-side validations (set errors but don't return)
    if (!role?.canSpendSol?.()) {
      setClientError("Selected role does not have permission to spend SOL");
    }

    if (roleLimit !== null && Number(solAmount) > roleLimit) {
      setClientError(`Amount exceeds role's spending limit of ${roleLimit} SOL`);
    }

    if (walletBalance !== null && Number(solAmount) > walletBalance) {
      setClientError(`Amount exceeds wallet balance of ${walletBalance} SOL`);
    }

    setIsTransferring(true);

    try {
      const connection = new Connection("http://localhost:8899", "confirmed");

      // Get the root keypair from localStorage
      const rootKeypairSecret = localStorage.getItem("rootKeypair");
      if (!rootKeypairSecret) {
        setClientError("Root keypair not found");
        return; // Keep this return as it's a critical requirement
      }
      const rootKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(rootKeypairSecret)));

      // Create the transfer instruction
      const transferIx = SystemProgram.transfer({
        fromPubkey: new PublicKey(swigAddress),
        toPubkey: new PublicKey(RECIPIENT_ADDRESS),
        lamports: amountInLamports,
      });

      // Create authority from the root keypair
      const authority = Ed25519Authority.fromPublicKey(rootKeypair.publicKey);

      // Debug logs
      const swig = await fetchSwig(connection, new PublicKey(swigAddress));
      const foundRole = swig.findRoleByAuthority(authority);
      console.log("Found role for root authority:", foundRole);
      console.log("Role can spend SOL:", foundRole?.canSpendSol?.());
      console.log("Role can manage authority:", foundRole?.canManageAuthority?.());
      console.log("All roles:", swig.roles);

      // Log role details
      console.log("Root role details:", {
        id: foundRole?.id,
        authorityType: foundRole?.authorityType,
        canSpendSol: foundRole?.canSpendSol?.(),
        canManageAuthority: foundRole?.canManageAuthority?.(),
      });

      // Let the SDK handle the validation and signing
      try {
        const signature = await signTransaction(
          connection,
          new PublicKey(swigAddress),
          authority,
          rootKeypair,
          [transferIx]
        );
        console.log("Transaction signed successfully with signature:", signature);
        setTxSignature(signature);

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, "confirmed");

        if (confirmation.value.err) {
          setSdkError("Transaction failed: " + JSON.stringify(confirmation.value.err));
        }
      } catch (error) {
        console.error("Detailed signing error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Transfer failed:", error);
      setSdkError((error as Error).message);
    } finally {
      setIsTransferring(false);
    }
  };

  const getExplorerUrl = (signature: string) => {
    const baseUrl = "https://explorer.solana.com";
    const encodedLocalhost = encodeURIComponent("http://localhost:8899");
    return `${baseUrl}/tx/${signature}?cluster=custom&customUrl=${encodedLocalhost}`;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSolAmount(e.target.value);
    // Clear errors and transaction signature when amount changes
    setClientError(null);
    setSdkError(null);
    setTxSignature(null);
  };

  return (
    <div className="flex flex-col gap-2 justify-between flex-grow">
      <div className="flex flex-col gap-4 justify-center">
        <h2 className="text-xl font-medium mb-2">You are logged in!</h2>
        {walletAddress ? (
          <div className="flex flex-col gap-2">
            <p>
              Your first PARA wallet address is: <span className="font-mono">{walletAddress}</span>
            </p>
            {walletBalance !== null && (
              <p className="text-lg font-medium text-blue-600 mb-4">
                Total Balance: {walletBalance.toFixed(4)} SOL
              </p>
            )}
          </div>
        ) : (
          <p>No wallet found.</p>
        )}
        <h2 className="text-lg font-medium mb-2">basic demo of sending SOL</h2>

        {swigAddress && roles.length > 0 ? (
          <div className="flex flex-col gap-2 max-w-md mx-auto mt-4">
            <h3 className="text-lg font-medium">Select Role</h3>
            <Select
              value={selectedRole}
              onChange={(value) => setSelectedRole(value as string)}
              options={roleOptions}
              placeholder="Select a role"
            />
            {selectedRole && (
              <div className="mt-2 p-4 border rounded">
                <h4 className="font-medium mb-2">Selected Role Details</h4>
                <p>Role Name: {roles[parseInt(selectedRole)].name}</p>
                <p>
                  Can Manage Authority:{" "}
                  {roles[parseInt(selectedRole)]?.canManageAuthority?.() === true ? "Yes" : "No"}
                </p>
                <p>
                  Can Spend SOL:{" "}
                  {roles[parseInt(selectedRole)]?.canSpendSol?.() === true ? "Yes" : "No"}
                </p>
                {roleLimit !== null && (
                  <p className="mt-2 text-blue-600">Spending Limit: {roleLimit.toFixed(4)} SOL</p>
                )}
              </div>
            )}

            <div className="mt-4 p-4 border rounded shadow-md">
              <h4 className="font-medium mb-2">Transfer SOL</h4>
              <p className="text-sm text-gray-600 mb-2">
                Recipient: <span className="font-mono">{RECIPIENT_ADDRESS}</span>
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={solAmount}
                  onChange={handleAmountChange}
                  placeholder="Amount in SOL"
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.001"
                  disabled={!selectedRole || isTransferring}
                />
                <Button
                  variant="primary"
                  onClick={handleTransfer}
                  disabled={!selectedRole || !solAmount || isTransferring}
                >
                  {isTransferring ? "Sending..." : "Send SOL"}
                </Button>
              </div>

              {/* Warnings and Errors Section */}
              <div className="mt-4 flex flex-col gap-3">
                {/* Warnings */}
                {roleLimit !== null && Number(solAmount) > roleLimit && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="text-sm text-orange-600">
                      Warning: Amount exceeds role's spending limit
                    </p>
                  </div>
                )}
                {walletBalance !== null && Number(solAmount) > walletBalance && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="text-sm text-orange-600">
                      Warning: Amount exceeds wallet balance
                    </p>
                  </div>
                )}

                {/* Client Error */}
                {clientError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-red-800">Client Validation Error:</p>
                    <p className="text-sm text-red-600">{clientError}</p>
                  </div>
                )}

                {/* SDK Error with Transaction Link */}
                {sdkError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-red-800">Transaction Error:</p>
                    <p className="text-sm text-red-600">{sdkError}</p>
                    {txSignature && (
                      <a
                        href={getExplorerUrl(txSignature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline block mt-2"
                      >
                        View failed transaction on Solana Explorer
                      </a>
                    )}
                  </div>
                )}

                {/* Success with Transaction Link */}
                {txSignature && !sdkError && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-800">Transaction successful!</p>
                    <a
                      href={getExplorerUrl(txSignature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline block mt-2"
                    >
                      View successful transaction on Solana Explorer
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 justify-center w-[50%] mx-auto">
            <p>No roles found. Please create a swig wallet first.</p>
            <Button variant="primary" onClick={() => setView("swig")}>
              Go to Swig Dashboard
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 justify-center w-[50%] mx-auto mt-6">
        <Button variant="secondary" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Defi;
