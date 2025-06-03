import { Keypair } from "@solana/web3.js";

// WARNING: This is for demonstration purposes only!
// NEVER expose private keys like this in production code!

// Fixed keypair for malicious authority simulation
// This represents a malicious smart contract's signing authority
const MALICIOUS_PRIVATE_KEY = new Uint8Array([
  96, 26, 64, 80, 200, 20, 97, 197, 168, 119, 33, 209, 114, 116, 196, 116, 204, 146, 245, 148, 179,
  197, 21, 106, 141, 156, 65, 242, 170, 99, 13, 46, 122, 120, 38, 116, 43, 190, 150, 109, 207, 172,
  106, 181, 46, 50, 41, 106, 35, 227, 224, 154, 83, 160, 62, 156, 50, 1, 135, 118, 169, 99, 58, 49,
]);

export const MALICIOUS_AUTHORITY_KEYPAIR = Keypair.fromSecretKey(MALICIOUS_PRIVATE_KEY);

// Helper function to get funding instructions
export const getMaliciousAuthorityInfo = () => {
  const publicKey = MALICIOUS_AUTHORITY_KEYPAIR.publicKey.toString();

  return {
    publicKey,
    airdropCommand: `solana airdrop 0.1 ${publicKey} --url devnet`,
    faucetUrl: `https://faucet.solana.com/?address=${publicKey}&cluster=devnet`,
    explorerUrl: `https://explorer.solana.com/address/${publicKey}?cluster=devnet`,
  };
};
