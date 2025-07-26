import { Button, Select } from "@swig/ui";
import { useSwigContext } from "../../../context/SwigContext";
import { useState, useEffect } from "react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { createEd25519AuthorityInfo, fetchSwig } from "@swig-wallet/classic";
import { signTransaction } from "../../../utils/swig/transactions";

interface DefiEd25519Props {
  walletAddress?: string;
  setView: (view: "defi_ed25519" | "swig" | "gas" | "bundled") => void;
}

const RECIPIENT_ADDRESS = "BKV7zy1Q74pyk3eehMrVQeau9pj2kEp6k36RZwFTFdHk";

const DefiEd25519: React.FC<DefiEd25519Props> = ({ walletAddress, setView }) => {
  const { roles, swigAddress, getConnection } = useSwigContext();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [solAmount, setSolAmount] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [roleLimit, setRoleLimit] = useState<number | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState(false);

  const roleOptions = roles.map((role, index) => ({
    value: index.toString(),
    label: role.name || `Role ${index + 1}`,
  }));

  useEffect(() => {
    const fetchBalanceAndLimit = async () => {
      if (swigAddress && selectedRole) {
        try {
          const connection = await getConnection();
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
    if (!role?.actions?.canSpendSol?.()) {
      setClientError("Selected role does not have permission to spend SOL");
    }

    if (roleLimit !== null && Number(solAmount) > roleLimit) {
      setClientError(`Amount exceeds role's spending limit of ${roleLimit} SOL`);
    }

    if (walletBalance !== null && Number(solAmount) > walletBalance) {
      setClientError(`Amount exceeds wallet balance of ${walletBalance} SOL`);
    }

    setIsTransferring(true);
    setTxFailed(false); // Reset txFailed on new attempt

    try {
      const connection = await getConnection();

      // Get the selected role's keypair from localStorage
      const roleKeypairSecret =
        localStorage.getItem(`rootKeypair_${selectedRole}`) ||
        localStorage.getItem(`roleKeypair_${selectedRole}`);
      if (!roleKeypairSecret) {
        setClientError(
          `Role keypair not found for role ${selectedRole}. This role may have been created before keypair storage was implemented. Please recreate the role.`
        );
        return;
      }
      const roleKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(roleKeypairSecret)));

      // Create the transfer instruction
      const transferIx = SystemProgram.transfer({
        fromPubkey: new PublicKey(swigAddress),
        toPubkey: new PublicKey(RECIPIENT_ADDRESS),
        lamports: amountInLamports,
      });

      // Create authority from the role keypair
      const authorityInfo = createEd25519AuthorityInfo(roleKeypair.publicKey);

      // Debug logs
      const swig = await fetchSwig(connection, new PublicKey(swigAddress));
      const foundRoles = swig.findRolesByEd25519SignerPk(roleKeypair.publicKey);

      if (foundRoles.length === 0) {
        setClientError(
          "Role not found for the selected authority. This may indicate a mismatch between the stored keypair and the role's authority."
        );
        return;
      }

      // Let the SDK handle the validation and signing
      const signature = await signTransaction(
        connection,
        new PublicKey(swigAddress),
        roleKeypair.publicKey,
        roleKeypair,
        [transferIx]
      );

      console.log("Sent tx:", signature);
      const confirmation = await connection.confirmTransaction(signature, "confirmed");
      console.log("Confirmation result:", confirmation);

      // Wait for confirmation and check status
      const { value: status } = await connection.getSignatureStatus(signature);
      // If not confirmed, fallback to getTransaction for more details
      let txError = null;
      if (!status || status.err) {
        txError = status?.err || "Unknown error";
      } else {
        // Optionally, you can use getTransaction for more details
        const txResult = await connection.getTransaction(signature, { commitment: "confirmed" });
        if (txResult?.meta?.err) {
          txError = txResult.meta.err;
        }
      }

      setTxSignature(signature);
      if (txError) {
        setTxFailed(true);
        setSdkError(typeof txError === "string" ? txError : JSON.stringify(txError));
      } else {
        setTxFailed(false);
      }
    } catch (error) {
      console.error("Transfer failed:", error);
      setSdkError((error as Error).message);
      setTxFailed(true);
    } finally {
      setIsTransferring(false);
    }
  };

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
        <h2 className="text-xl font-medium mb-2">Basic demo of sending SOL</h2>
        {walletAddress ? (
          <div className="flex flex-col gap-2">
            {walletBalance !== null && (
              <p className="text-lg font-medium text-blue-600 mb-4">
                Total Balance: {walletBalance.toFixed(4)} SOL
              </p>
            )}
          </div>
        ) : (
          <p>No wallet found.</p>
        )}

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
                  {roles[parseInt(selectedRole)]?.actions?.canManageAuthority?.() === true ? "Yes" : "No"}
                </p>
                <p>
                  Can Spend SOL:{" "}
                  {roles[parseInt(selectedRole)]?.actions?.canSpendSol?.() === true ? "Yes" : "No"}
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

                {/* SDK Error with Transaction Link (takes precedence if present) */}
                {sdkError ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-red-800">Transaction Error:</p>
                    <p className="text-sm text-red-600">{sdkError}</p>
                    {txSignature && !isTransferring && (
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
                ) : (
                  txSignature &&
                  !isTransferring && (
                    <div
                      className={`p-3 border rounded-md ${
                        txFailed ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          txFailed ? "text-red-800" : "text-green-800"
                        }`}
                      >
                        {txFailed ? "Transaction failed." : "Transaction successful!"}
                      </p>
                      <a
                        href={getExplorerUrl(txSignature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline block mt-2"
                      >
                        View transaction on Solana Explorer
                      </a>
                    </div>
                  )
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
    </div>
  );
};

export default DefiEd25519;
