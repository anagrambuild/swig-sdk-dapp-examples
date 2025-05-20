import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Actions, createSwig, Ed25519Authority, findSwigPda } from "@swig-wallet/classic";

export async function createSwigAccount(
  connection: Connection,
  permissionType: "locked" | "permissive" = "locked"
) {
  try {
    // Generate a random ID for the Swig account
    const id = new Uint8Array(32);
    crypto.getRandomValues(id);
    console.log("permissionType", permissionType);
    // Generate a keypair for the root authority
    const rootKeypair = Keypair.generate();

    // Find the Swig PDA
    const [swigAddress] = findSwigPda(id);

    console.log("Requesting airdrop for root authority...");
    // Request airdrop for the root authority only (PDAs cannot receive airdrops)
    const signature = await connection.requestAirdrop(
      rootKeypair.publicKey,
      2 * LAMPORTS_PER_SOL // Request 2 SOL to cover creation costs and have some left for transfers
    );

    // Wait for airdrop to be confirmed
    await connection.confirmTransaction(signature);
    console.log("Airdrop confirmed");

    // Create root authority
    const rootAuthority = Ed25519Authority.fromPublicKey(rootKeypair.publicKey);

    // Set up root actions based on permission type
    const rootActions = Actions.set();
    if (permissionType === "locked") {
      rootActions.manageAuthority();
    } else {
      rootActions.all();
    }

    console.log("Creating Swig account...");
    // Create the Swig account
    const tx = await createSwig(
      connection,
      id,
      rootAuthority,
      rootActions.get(),
      rootKeypair.publicKey,
      [rootKeypair]
    );

    // Wait for transaction to be confirmed
    await connection.confirmTransaction(tx);
    console.log("Swig account created successfully!");
    console.log("Swig address:", swigAddress.toBase58());
    console.log("Root authority address:", rootKeypair.publicKey.toBase58());

    // Get the balance of the root authority
    const rootBalance = await connection.getBalance(rootKeypair.publicKey);
    console.log("Root authority balance:", rootBalance / LAMPORTS_PER_SOL, "SOL");

    return {
      swigAddress,
      rootKeypair,
      rootKeypairSecret: Array.from(rootKeypair.secretKey), // Convert to regular array for storage
    };
  } catch (error) {
    console.error("Error in createSwigAccount:", error);
    throw error;
  }
}
