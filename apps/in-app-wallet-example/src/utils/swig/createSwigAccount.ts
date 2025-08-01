import { Connection, Keypair, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { Actions, getCreateSwigInstruction, createEd25519AuthorityInfo, findSwigPda } from "@swig-wallet/classic";

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
    const swigAddress = findSwigPda(id);

    console.log("Requesting airdrop for root authority...");
    // Request airdrop for the root authority only (PDAs cannot receive airdrops)
    const airdropSignature = await connection.requestAirdrop(
      rootKeypair.publicKey,
      2 * LAMPORTS_PER_SOL // Request 2 SOL to cover creation costs and have some left for transfers
    );

    const { blockhash: airdropBlockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    
    // Wait for airdrop to be confirmed
    await connection.confirmTransaction({
      signature: airdropSignature,
      blockhash: airdropBlockhash,
      lastValidBlockHeight: lastValidBlockHeight
    });
    console.log("Airdrop confirmed");

    // Create root authority info
    const rootAuthorityInfo = createEd25519AuthorityInfo(rootKeypair.publicKey);

    // Set up root actions based on permission type
    const rootActions = Actions.set();
    if (permissionType === "locked") {
      rootActions.manageAuthority();
    } else {
      rootActions.all();
    }

    console.log("Creating Swig account...");
    // Create the Swig account instruction
    const createSwigIx = await getCreateSwigInstruction({
      payer: rootKeypair.publicKey,
      id,
      actions: rootActions.get(),
      authorityInfo: rootAuthorityInfo,
    });

    // Create and send transaction
    const tx = new Transaction().add(createSwigIx);
    tx.feePayer = rootKeypair.publicKey;
    const { blockhash: txBlockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = txBlockhash;
    tx.sign(rootKeypair);

    const signature = await sendAndConfirmTransaction(connection, tx, [rootKeypair]);
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
