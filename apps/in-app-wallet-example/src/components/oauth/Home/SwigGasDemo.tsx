import { useState } from "react";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  createEd25519AuthorityInfo,
  Actions,
  getAddAuthorityInstructions,
  fetchSwig,
  getSignInstructions,
  Role,
} from "@swig-wallet/classic";
import { Button } from "@swig/ui";
import { useSwigContext } from "../../../context/SwigContext";
import { sendAndConfirm } from "../../../utils/swig";
import SwigAdd from "./SwigAdd";

export default function SwigTokenDemo() {
  const { swigAddress, getRoles, getConnection } = useSwigContext();

  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [txUrl, setTxUrl] = useState<string | null>(null);

  const [rootKeypair, setRootKeypair] = useState<Keypair | null>(null);
  const [swig, setSwig] = useState<any>(null);
  const [usdcMint, setUsdcMint] = useState<PublicKey | null>(null);
  const [swigUsdcAta, setSwigUsdcAta] = useState<PublicKey | null>(null);
  const [recipUsdcAta, setRecipUsdcAta] = useState<PublicKey | null>(null);
  const [devWallet, setDevWallet] = useState<Keypair | null>(null);
  const [recipient, setRecipient] = useState<Keypair | null>(null);
  const [devRole, setDevRole] = useState<Role | null>(null);

  const [swigUsdcBalance, setSwigUsdcBalance] = useState<number | null>(null);
  const [recipUsdcBalance, setRecipUsdcBalance] = useState<number | null>(null);

  const [currentStep, setCurrentStep] = useState(0);

  const refreshBalances = async () => {
    if (!swigUsdcAta || !recipUsdcAta) return;
    const conn = await getConnection();
    const swigBalance = await conn.getTokenAccountBalance(swigUsdcAta);
    const recipBalance = await conn.getTokenAccountBalance(recipUsdcAta);
    setSwigUsdcBalance(Number(swigBalance.value.uiAmountString));
    setRecipUsdcBalance(Number(recipBalance.value.uiAmountString));
  };

  const handle = async (label: string, fn: () => Promise<void>, stepIndex: number) => {
    setStatus(`<span class='text-orange-500'>${label} (in progress)</span>`);
    setError(null);
    try {
      await fn();
      setStatus(`<span class='text-green-600'>${label} (success)</span>`);
      setCurrentStep(stepIndex + 1);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
      setStatus(`<span class='text-red-600'>${label} (error)</span>`);
    }
  };

  const reset = () => {
    setStatus("");
    setError(null);
    setTxUrl(null);
    setRootKeypair(null);
    setSwig(null);
    setUsdcMint(null);
    setSwigUsdcAta(null);
    setRecipUsdcAta(null);
    setDevWallet(null);
    setRecipient(null);
    setDevRole(null);
    setSwigUsdcBalance(null);
    setRecipUsdcBalance(null);
    setCurrentStep(0);
  };

  const steps = [
    {
      label: "Step 1: Fetch Swig + Root Authority",
      action: () =>
        handle("Fetching Swig + Root Authority", async () => {
          if (!swigAddress) throw new Error("Swig wallet not initialized");
          const swigPubkey = new PublicKey(swigAddress);
          const conn = await getConnection();
          const fetched = await fetchSwig(conn, swigPubkey);
          setSwig(fetched);

          const rootKeypairSecret =
            localStorage.getItem("rootKeypair_0") || localStorage.getItem("roleKeypair_0");
          if (!rootKeypairSecret)
            throw new Error("Root keypair not found. Please create a role first.");
          setRootKeypair(Keypair.fromSecretKey(new Uint8Array(JSON.parse(rootKeypairSecret))));
        }, 0),
    },
    {
      label: "Step 2: Airdrop and Create Dev Wallet + Recipient",
      action: () =>
        handle("Setting up wallets", async () => {
          const conn = await getConnection();
          const dev = Keypair.generate();
          const recip = Keypair.generate();
          setDevWallet(dev);
          setRecipient(recip);
          await conn.requestAirdrop(dev.publicKey, LAMPORTS_PER_SOL);
          await conn.requestAirdrop(recip.publicKey, LAMPORTS_PER_SOL);
          await new Promise((r) => setTimeout(r, 3000));
        }, 1),
    },
    {
      label: "Step 3: Create USDC Mint and Token Accounts",
      action: () =>
        handle("Mint + Token Accounts", async () => {
          const conn = await getConnection();
          if (!devWallet || !recipient || !swigAddress) throw new Error("Missing dependencies");
          const mint = await createMint(conn, devWallet, devWallet.publicKey, null, 6);
          setUsdcMint(mint);

          const swigAta = await getOrCreateAssociatedTokenAccount(
            conn,
            devWallet,
            mint,
            new PublicKey(swigAddress),
            true
          );
          setSwigUsdcAta(swigAta.address);

          const recipAta = await getOrCreateAssociatedTokenAccount(
            conn,
            devWallet,
            mint,
            recipient.publicKey
          );
          setRecipUsdcAta(recipAta.address);
        }, 2),
    },
    {
      label: "Step 4: Mint 1000 USDC to Swig",
      action: () =>
        handle("Minting 1000 USDC", async () => {
          const conn = await getConnection();
          if (!usdcMint || !swigUsdcAta || !devWallet) throw new Error("Minting failed");
          await mintTo(
            conn,
            devWallet,
            usdcMint,
            swigUsdcAta,
            devWallet.publicKey,
            1000 * 10 ** 6
          );
          await refreshBalances();
        }, 3),
    },
    {
      label: "Step 5: Add Token Spending Role to Dev Wallet",
      action: () =>
        handle("Assigning token role", async () => {
          const conn = await getConnection();
          if (!swig || !rootKeypair || !usdcMint || !devWallet)
            throw new Error("Missing role deps");

          const rootRoles = swig.findRolesByEd25519SignerPk(rootKeypair.publicKey);
          const rootRole = rootRoles[0];
          const devAuthInfo = createEd25519AuthorityInfo(devWallet.publicKey);
          const ixs = await getAddAuthorityInstructions(
            swig,
            rootRole.id,
            devAuthInfo,
            Actions.set()
              .tokenLimit({
                mint: usdcMint,
                amount: BigInt(1000 * 10 ** 6),
              })
              .get()
          );
          await sendAndConfirm(conn, ixs[0], rootKeypair);
          await swig.refetch();
          const devRoles = swig.findRolesByEd25519SignerPk(devWallet.publicKey);
          setDevRole(devRoles[0]);
        }, 4),
    },
    {
      label: "Step 6: Transfer 250 USDC from Swig to Recipient",
      action: () =>
        handle("Transferring 250 USDC", async () => {
          const conn = await getConnection();
          if (!swigUsdcAta || !recipUsdcAta || !swigAddress || !devRole || !devWallet) {
            throw new Error("Transfer missing dependencies");
          }

          const ix = createTransferInstruction(
            swigUsdcAta,
            recipUsdcAta,
            new PublicKey(swigAddress),
            250 * 10 ** 6,
            [],
            TOKEN_PROGRAM_ID
          );

          const signedIxs = await getSignInstructions(swig, devRole.id, [ix]);
          const signed = signedIxs[0];
          const sig = await sendAndConfirm(conn, signed, devWallet);
          const network = localStorage.getItem("swig_network") || "localnet";
          const explorerUrl =
            network === "devnet"
              ? `https://explorer.solana.com/tx/${sig}?cluster=devnet`
              : `https://explorer.solana.com/tx/${sig}?cluster=custom&customUrl=${encodeURIComponent(
                  "http://localhost:8899"
                )}`;
          setTxUrl(explorerUrl);
          await getRoles();
          await refreshBalances();
        }, 5),
    },
  ];

  if (!swigAddress) {
    return <SwigAdd />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Swig Gas Sponsorship Demo</h2>
      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          {steps.map((step, index) => (
            <Step
              key={index}
              label={step.label}
              showButton={index === currentStep}
              onClick={step.action}
            />
          ))}
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>

        <div className="space-y-4 text-sm">
          {status && <div className="text-sm" dangerouslySetInnerHTML={{ __html: status }} />}
          {error && (
            <p className="text-red-600 border border-red-200 p-2 rounded">Error: {error}</p>
          )}
          {txUrl && (
            <a
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline block"
            >
              View Transaction on Solana Explorer
            </a>
          )}
        </div>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {swigAddress && (
          <div className="border p-4 rounded shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Swig Wallet</h3>
            <p className="text-gray-600">Address:</p>
            <p className="font-mono break-all mb-2">{swigAddress}</p>
            <p className="text-blue-600">
              USDC Balance: {swigUsdcBalance !== null ? swigUsdcBalance.toFixed(2) : "--"}
            </p>
          </div>
        )}
        {recipient && (
          <div className="border p-4 rounded shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Recipient Wallet</h3>
            <p className="text-gray-600">Address:</p>
            <p className="font-mono break-all mb-2">{recipient.publicKey.toBase58()}</p>
            <p className="text-green-600">
              USDC Balance: {recipUsdcBalance !== null ? recipUsdcBalance.toFixed(2) : "--"}
            </p>
          </div>
        )}
        {devWallet && (
          <div className="border p-4 rounded shadow-sm col-span-1 md:col-span-2">
            <h3 className="font-semibold text-lg mb-2">Developer Wallet (Fee Payer)</h3>
            <p className="text-gray-600">Address:</p>
            <p className="font-mono break-all">{devWallet.publicKey.toBase58()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({
  label,
  onClick,
  showButton,
}: {
  label: string;
  onClick: () => void;
  showButton: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="font-medium">{label}</p>
      {showButton && <Button onClick={onClick}>Run</Button>}
    </div>
  );
}