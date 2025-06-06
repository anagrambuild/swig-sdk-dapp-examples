import { Button, Select } from "@swig/ui";
import { useSwigContext } from "../../../context/SwigContext";
import { useState, useEffect } from "react";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  Secp256k1Authority,
  signInstruction,
  type InstructionDataOptions,
} from "@swig-wallet/classic";
import { hexToBytes } from "@noble/curves/abstract/utils";
import { para } from "../../../client/para";
import { getEvmWalletPublicKey } from "../../../utils/evm/publickey";
import React from "react";
import { keccak_256 } from '@noble/hashes/sha3';

interface DefiProps {
  walletAddress?: string;
  setView: (view: "defi_ed25519" | "swig" | "gas" | "bundled") => void;
}

const RECIPIENT_ADDRESS = "BKV7zy1Q74pyk3eehMrVQeau9pj2kEp6k36RZwFTFdHk";

const DefiSecpPara: React.FC<DefiProps> = ({ walletAddress, setView }) => {
  const { roles, swigAddress, getConnection } = useSwigContext();
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
          const connection = await getConnection();
          const balanceInLamports = await connection.getBalance(new PublicKey(swigAddress));
          const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
          setWalletBalance(balanceInSol);

          // Get the selected role's SOL limit
          const role = roles[parseInt(selectedRole)];
          if (role?.canSpendSol?.()) {
            const limit = role.solSpendLimit();
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
    setClientError(null);
    setSdkError(null);
    setTxSignature(null);

    if (!selectedRole || !solAmount || !swigAddress) {
      setClientError("Please select a role and enter an amount");
      return;
    }

    const role = roles[parseInt(selectedRole)];
    const amountInLamports = Number(solAmount) * LAMPORTS_PER_SOL;

    if (!role?.canSpendSol?.()) {
      setClientError("Selected role does not have permission to spend SOL");
      return;
    }

    if (roleLimit !== null && Number(solAmount) > roleLimit) {
      setClientError(`Amount exceeds role's spending limit of ${roleLimit} SOL`);
      return;
    }

    if (walletBalance !== null && Number(solAmount) > walletBalance) {
      setClientError(`Amount exceeds wallet balance of ${walletBalance} SOL`);
      return;
    }

    setIsTransferring(true);

    try {
      const connection = await getConnection();

      // Create a fee payer and fund it
      const feePayer = Keypair.generate();
      const airdropSig = await connection.requestAirdrop(feePayer.publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(airdropSig, "confirmed");

      // Get EVM public key
      const publicKeyHex = await getEvmWalletPublicKey();
      if (!publicKeyHex) {
        setClientError("No EVM wallet found");
        return;
      }

      const pubKeyBytes = hexToBytes(
        publicKeyHex.startsWith("0x") ? publicKeyHex.slice(2) : publicKeyHex
      );
      const authority = Secp256k1Authority.fromPublicKeyBytes(pubKeyBytes);
      console.log("Authority", role.authority);

      // Prepare transfer instruction
      const transferIx = SystemProgram.transfer({
        fromPubkey: new PublicKey(swigAddress),
        toPubkey: new PublicKey(RECIPIENT_ADDRESS),
        lamports: amountInLamports,
      });

      // Signing options with Para
      const instOptions: InstructionDataOptions = {
        currentSlot: BigInt(await connection.getSlot("finalized")),
        signingFn: async (msg: Uint8Array) => {
          if (!walletAddress) throw new Error("No wallet address provided");

          //hash msg with keccak256
          const hashedMsg = keccak_256(msg);

          const base64Msg = Buffer.from(hashedMsg).toString("base64");
          const wallet = await para.findWalletByAddress(walletAddress);
          if (!wallet) throw new Error("Para wallet not found for this address");

          const res = await para.signMessage({
            walletId: wallet.id,
            messageBase64: base64Msg,
          });

          if ("signature" in res) {
            let sigBytes = Uint8Array.from(Buffer.from(res.signature, "hex"));
            if (sigBytes.length !== 65) {
              throw new Error(`EVM signature must be 65 bytes (got ${sigBytes.length})`);
            }
            sigBytes[64] = sigBytes[64] ? 28 : 27;
            return { signature: sigBytes };
          } else {
            throw new Error("Signature denied or not returned from Para");
          }
        },
      };

      // Sign with Swig + Secp256k1 via Para
      const signedIx = await signInstruction(role, feePayer.publicKey, [transferIx], instOptions);

      const tx = new Transaction().add(signedIx);
      tx.feePayer = feePayer.publicKey;

      const sig = await sendAndConfirmTransaction(connection, tx, [feePayer]);
      setTxSignature(sig);
    } catch (err) {
      console.error("Transfer failed:", err);
      setSdkError((err as Error).message);
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
    setClientError(null);
    setSdkError(null);
    setTxSignature(null);
  };

  if (!swigAddress) {
    return (
      <div className="flex flex-col gap-2 justify-center w-[50%] mx-auto">
        <p>No roles found. Please create a swig wallet first.</p>
        <Button variant="primary" onClick={() => setView("swig")}>
          Go to Swig Dashboard
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 justify-between flex-grow">
      <div className="flex flex-col gap-4 justify-center">
        {walletAddress ? (
          <div className="flex flex-col gap-2">
            {walletBalance !== null && (
              <p className="text-lg font-medium text-blue-600 mb-4">
                Balance: {walletBalance.toFixed(4)} SOL
              </p>
            )}
          </div>
        ) : (
          <p>No wallet connected.</p>
        )}

        {swigAddress && roles.length > 0 && (
          <div className="flex flex-col gap-4 max-w-md mx-auto mt-4">
            <Select
              value={selectedRole}
              onChange={(value) => setSelectedRole(value as string)}
              options={roleOptions}
              placeholder="Select a role"
            />

            {selectedRole && (
              <div className="p-4 border rounded">
                <p>Role Name: {roles[parseInt(selectedRole)].name}</p>
                <p>
                  Can Spend SOL: {roles[parseInt(selectedRole)]?.canSpendSol?.() ? "Yes" : "No"}
                </p>
                {roleLimit !== null && (
                  <p className="text-blue-600">Limit: {roleLimit.toFixed(4)} SOL</p>
                )}
              </div>
            )}

            <div className="p-4 border rounded shadow-md">
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
                  className="flex-1 px-3 py-2 border rounded-md"
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

              {roleLimit !== null && Number(solAmount) > roleLimit && (
                <p className="text-orange-600 mt-2 text-sm">Warning: Exceeds role limit</p>
              )}
              {walletBalance !== null && Number(solAmount) > walletBalance && (
                <p className="text-orange-600 mt-2 text-sm">Warning: Exceeds wallet balance</p>
              )}
              {clientError && <p className="text-red-600 mt-2 text-sm">{clientError}</p>}
              {sdkError && <p className="text-red-600 mt-2 text-sm">{sdkError}</p>}
              {txSignature && !sdkError && (
                <a
                  href={getExplorerUrl(txSignature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 mt-2 underline text-sm"
                >
                  View transaction on Solana Explorer
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DefiSecpPara;
