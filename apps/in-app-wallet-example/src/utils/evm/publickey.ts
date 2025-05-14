export async function getEvmWalletPublicKey(): Promise<string | null> {
    const allWalletsRaw = localStorage.getItem("@CAPSULE/wallets");
  
    if (!allWalletsRaw) return null;
  
    try {
      const allWallets = JSON.parse(allWalletsRaw);
      const walletKeys = Object.keys(allWallets);
  
      for (let i = 0; i < Math.min(2, walletKeys.length); i++) {
        const key = walletKeys[i];
        const wallet = allWallets[key];
  
        if (wallet.type === "EVM") {
          return wallet.publicKey;
        }
      }
    } catch (error) {
      console.error("Failed to parse wallets JSON:", error);
    }
  
    return null;
  }
  