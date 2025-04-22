import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  Actions,
  createSwig,
  Ed25519Authority,
  findSwigPda,
} from '@swig-wallet/classic';

export async function createSwigAccount(
  connection: Connection,
  permissionType: 'locked' | 'permissive' = 'locked'
) {
  // Generate a random ID for the Swig account
  const id = new Uint8Array(32);
  crypto.getRandomValues(id);

  // Generate a keypair for the root authority
  const rootKeypair = Keypair.generate();

  // Request airdrop for the root authority
  await connection.requestAirdrop(rootKeypair.publicKey, LAMPORTS_PER_SOL);

  // Wait for airdrop to be confirmed
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Find the Swig PDA
  const [swigAddress] = findSwigPda(id);

  // Create root authority
  const rootAuthority = new Ed25519Authority(rootKeypair.publicKey);

  // Set up root actions based on permission type
  const rootActions = Actions.set();
  if (permissionType === 'locked') {
    rootActions.manageAuthority();
  } else {
    rootActions.all();
  }

  // Create the Swig account
  await createSwig(
    connection,
    id,
    rootAuthority,
    rootActions.get(),
    rootKeypair.publicKey,
    [rootKeypair]
  );

  // Wait for transaction to be confirmed
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('Swig account created successfully!');
  console.log('Swig address:', swigAddress.toBase58());

  return {
    swigAddress,
    rootKeypair,
    rootKeypairSecret: Array.from(rootKeypair.secretKey), // Convert to regular array for storage
  };
}
