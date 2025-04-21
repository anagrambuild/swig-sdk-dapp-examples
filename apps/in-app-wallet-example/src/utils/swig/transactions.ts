import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  Ed25519Authority,
  fetchSwig,
  signInstruction,
} from '@swig-wallet/classic';

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
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;

  transaction.sign(payer);

  return connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: true,
  });
}

export async function checkTransactionLimits(
  connection: Connection,
  swigAddress: PublicKey,
  authority: Ed25519Authority,
  limits: TransactionLimits
): Promise<boolean> {
  const swig = await fetchSwig(connection, swigAddress);
  const role = swig.findRoleByAuthority(authority);

  if (!role) {
    throw new Error('Role not found for authority');
  }

  // Check SOL limit
  if (limits.solAmount > 0) {
    const canSpendSol = role.canSpendSol(
      BigInt(limits.solAmount * LAMPORTS_PER_SOL)
    );
    if (!canSpendSol) {
      return false;
    }
  }

  return true;
}

export async function signTransaction(
  connection: Connection,
  swigAddress: PublicKey,
  authority: Ed25519Authority,
  authorityKeypair: Keypair,
  instructions: any[]
): Promise<string> {
  const swig = await fetchSwig(connection, swigAddress);
  const role = swig.findRoleByAuthority(authority);

  if (!role) {
    throw new Error('Role not found for authority');
  }

  const signIx = signInstruction(
    role,
    authorityKeypair.publicKey,
    instructions
  );

  return sendTransaction(connection, signIx, authorityKeypair);
}

export async function getRoleCapabilities(
  connection: Connection,
  swigAddress: PublicKey,
  authority: Ed25519Authority
) {
  const swig = await fetchSwig(connection, swigAddress);
  const role = swig.findRoleByAuthority(authority);

  if (!role) {
    throw new Error('Role not found for authority');
  }

  return {
    canManageAuthority: role.canManageAuthority(),
    canSpendSol: role.canSpendSol(),
  };
}
