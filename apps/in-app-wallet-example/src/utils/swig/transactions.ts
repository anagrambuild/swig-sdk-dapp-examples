import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { fetchSwig, getSignInstructions } from "@swig-wallet/classic";

export interface TransactionLimits {
  solAmount: number;
}

export async function sendTransaction(
  connection: Connection,
  instruction: TransactionInstruction,
  payer: Keypair
) {
  const transaction = new Transaction().add(instruction);
  transaction.feePayer = payer.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.sign(payer);

  return connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: true,
  });
}

export async function checkTransactionLimits(
  connection: Connection,
  swigAddress: PublicKey,
  authorityPublicKey: PublicKey,
  limits: TransactionLimits
): Promise<boolean> {
  const swig = await fetchSwig(connection, swigAddress);
  const role = swig.findRolesByEd25519SignerPk(authorityPublicKey)[0];

  if (!role) throw new Error("Role not found for authority");

  if (limits.solAmount > 0) {
    const canSpendSol = role.actions.canSpendSol(BigInt(limits.solAmount * LAMPORTS_PER_SOL));
    if (!canSpendSol) return false;
  }

  return true;
}

export async function signTransaction(
  connection: Connection,
  swigAddress: PublicKey,
  authorityPublicKey: PublicKey,
  authorityKeypair: Keypair,
  instructions: TransactionInstruction[],
  feePayer?: Keypair // Optional fee payer, defaults to authorityKeypair
): Promise<string> {
  const swig = await fetchSwig(connection, swigAddress);
  const role = swig.findRolesByEd25519SignerPk(authorityPublicKey)[0];

  if (!role) throw new Error("Role not found for authority");

  // Get the swig-wrapped instructions
  const signInstructions = await getSignInstructions(swig, role.id, instructions);

  if (!signInstructions || signInstructions.length === 0) {
    throw new Error("No sign instructions returned from Swig");
  }
  const signedInstruction = signInstructions[0];
  const actualFeePayer = feePayer || authorityKeypair;
  const extraSigners = feePayer && feePayer !== authorityKeypair ? [authorityKeypair] : [];

  // Send the transaction with proper confirmation
  return sendAndConfirm(connection, signedInstruction, actualFeePayer, extraSigners);
}

export async function getRoleCapabilities(
  connection: Connection,
  swigAddress: PublicKey,
  authorityPublicKey: PublicKey
) {
  const swig = await fetchSwig(connection, swigAddress);
  const role = swig.findRolesByEd25519SignerPk(authorityPublicKey)[0];

  if (!role) throw new Error("Role not found for authority");

  return {
    canManageAuthority: role.actions.canManageAuthority(),
    canSpendSol: role.actions.canSpendSol(),
  };
}

export async function sendAndConfirm(
  connection: Connection,
  ix: Transaction | TransactionInstruction,
  feePayer: Keypair,
  extraSigners: Keypair[] = []
): Promise<string> {
  const tx = ix instanceof Transaction ? ix : new Transaction().add(ix);
  tx.feePayer = feePayer.publicKey;

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  // Sign the transaction
  tx.sign(feePayer, ...extraSigners);

  // Send with retry logic
  let sig: string;
  try {
    sig = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false, // Enable preflight for better error messages
      preflightCommitment: "confirmed",
    });
  } catch (error) {
    console.error("Failed to send transaction:", error);

    // Check if it's a SendTransactionError and extract logs
    if (error && typeof error === "object" && "getLogs" in error) {
      try {
        const logs = (error as any).getLogs();
        console.error("Transaction logs:", logs);
        throw new Error(
          `Transaction send failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }. Logs: ${JSON.stringify(logs)}`
        );
      } catch (logError) {
        console.error("Could not get transaction logs:", logError);
      }
    }

    throw new Error(
      `Transaction send failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  // Confirm the transaction with timeout
  try {
    await connection.confirmTransaction(
      {
        signature: sig,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );
  } catch (error) {
    console.error("Transaction confirmation failed:", error);
    throw new Error(
      `Transaction confirmation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return sig;
}
