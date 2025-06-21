import { Connection, Transaction } from "@solana/web3.js";

export async function sendViaSwigPopup(
  tx: Transaction,
  connection: Connection
): Promise<{ success: boolean; signature?: string; error?: string }> {
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  const base64Tx = encodeURIComponent(tx.serialize({ requireAllSignatures: false }).toString("base64"));
  const requestId = crypto.randomUUID();

  const SWIG_EXTENSION_ID = "ngkjcjceookedgnmacgheeblecefegce";
  const popupUrl = `chrome-extension://${SWIG_EXTENSION_ID}/index.html#/transaction-request?transaction=${base64Tx}&requestId=${requestId}`;
  const popup = window.open(popupUrl, "_blank", "width=400,height=600");

  if (!popup) {
    return { success: false, error: "Popup blocked or failed to open" };
  }

  return new Promise((resolve) => {
    const listener = (event: MessageEvent) => {
      const msg = event.data;
      if (msg && msg.source === "swig-extension" && msg.requestId === requestId) {
        window.removeEventListener("message", listener);
        popup.close();

        if (msg.action === "transaction_signed") {
          resolve({ success: true, signature: msg.signature });
        } else if (msg.action === "transaction_cancelled") {
          resolve({ success: false, error: "User cancelled the transaction" });
        } else if (msg.action === "transaction_error") {
          resolve({ success: false, error: msg.error });
        } else {
          resolve({ success: false, error: "Unexpected response" });
        }
      }
    };
    window.addEventListener("message", listener);

    setTimeout(() => {
      window.removeEventListener("message", listener);
      popup.close();
      resolve({ success: false, error: "Transaction timed out" });
    }, 60000);
  });
}
