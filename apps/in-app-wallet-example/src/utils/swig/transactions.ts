import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Ed25519Authority, fetchSwig, getSignInstructions } from "@swig-wallet/classic";

export interface TransactionLimits {
  solAmount: number;
}

export async function sendTransaction(
  connection: Connection,
  instruction: TransactionInstruction,
  payer: Keypair
) {
  const transaction = new Transaction();
  transaction.instructions = [instruction];
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
  const roles = swig.findRolesByEd25519SignerPk(authorityPublicKey);

  if (roles.length === 0) {
    throw new Error("Role not found for authority");
  }

  const role = roles[0];

  // Check SOL limit
  if (limits.solAmount > 0) {
    const canSpendSol = role.actions.canSpendSol(BigInt(limits.solAmount * LAMPORTS_PER_SOL));
    if (!canSpendSol) {
      return false;
    }
  }

  return true;
}

export async function signTransaction(
  connection: Connection,
  swigAddress: PublicKey,
  authorityPublicKey: PublicKey,
  authorityKeypair: Keypair,
  instructions: any[]
): Promise<string> {
  const swig = await fetchSwig(connection, swigAddress);
  const roles = swig.findRolesByEd25519SignerPk(authorityPublicKey);

  if (roles.length === 0) {
    throw new Error("Role not found for authority");
  }

  const role = roles[0];
  const signIxs = await getSignInstructions(swig, role.id, instructions);

  return sendTransaction(connection, signIxs[0], authorityKeypair);
}

export async function getRoleCapabilities(
  connection: Connection,
  swigAddress: PublicKey,
  authorityPublicKey: PublicKey
) {
  const swig = await fetchSwig(connection, swigAddress);
  const roles = swig.findRolesByEd25519SignerPk(authorityPublicKey);

  if (roles.length === 0) {
    throw new Error("Role not found for authority");
  }

  const role = roles[0];

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
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  tx.sign(feePayer, ...extraSigners);

  const sig = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: true,
  });

  await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  return sig;
}
