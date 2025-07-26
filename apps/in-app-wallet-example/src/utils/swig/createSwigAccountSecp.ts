import { 
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  Actions,
  findSwigPda,
  createSecp256k1AuthorityInfo,
  getCreateSwigInstruction,
} from "@swig-wallet/classic";
import { para } from "../../client/para";
import { hexToBytes } from "@noble/curves/abstract/utils";

export interface SecpParaSwigResult {
  swigAddress: string;
  swigAddressSecret: number[];
  rootPubkeySecp256k1: string;
  walletAddress: string;
  payerPubkey: string;
  createSignature: string;
}

export async function createSwigAccountSecpPara(
  connection: Connection,
  walletAddress: string,
  permissionType: "locked" | "permissive" = "locked",
): Promise<SecpParaSwigResult> {
  const wallet = await para.findWalletByAddress(walletAddress);
  if (!wallet) throw new Error(`Para wallet not found for ${walletAddress}`);

  const publicKeyHex = wallet.publicKeyHex ?? wallet.publicKey;
  if (!publicKeyHex) throw new Error("Para wallet did not return a secp256k1 public key");

  const pubKeyBytes = hexToBytes(publicKeyHex.replace(/^0x/, ""));

  const id = new Uint8Array(32);
  crypto.getRandomValues(id);
  const payer = Keypair.generate();
  const swigAddress = findSwigPda(id);

  // Airdrop
  const airdropSig = await connection.requestAirdrop(
    payer.publicKey,
    2 * LAMPORTS_PER_SOL,
  );
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    { signature: airdropSig, blockhash, lastValidBlockHeight },
    "confirmed",
  );

  // Actions
  const rootActions = Actions.set();
  permissionType === "locked" ? rootActions.manageAuthority() : rootActions.all();

  const createIx = await getCreateSwigInstruction({
    authorityInfo: createSecp256k1AuthorityInfo(pubKeyBytes),
    id,
    payer: payer.publicKey,
    actions: rootActions.get(),
  });

  const createSwigTx = new Transaction().add(createIx);
  const createSignature = await sendAndConfirmTransaction(
    connection,
    createSwigTx,
    [payer],
  );

  return {
    swigAddress: swigAddress.toBase58(),
    swigAddressSecret: Array.from(payer.secretKey),
    rootPubkeySecp256k1: publicKeyHex.replace(/^0x/, ""),
    walletAddress,
    payerPubkey: payer.publicKey.toBase58(),
    createSignature,
  };
}
