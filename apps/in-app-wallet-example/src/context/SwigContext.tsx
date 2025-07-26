import { createContext, useContext, useState, ReactNode } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, Keypair } from "@solana/web3.js";
import {
  fetchSwig,
  Role,
  Actions,
  createEd25519AuthorityInfo,
  createSecp256k1AuthorityInfo,
  getAddAuthorityInstructions,
  type InstructionDataOptions,
} from "@swig-wallet/classic";
import { para } from "../client/para";
import { createSwigAccount } from "../utils/swig";
import { hexToBytes } from "@noble/curves/abstract/utils";
import { getEvmWalletPublicKey } from "../utils/evm/publickey";
import { createSwigAccountSecpPara } from "../utils/swig/createSwigAccountSecp";
import { keccak_256 } from "@noble/hashes/sha3";
import React from "react";

interface RoleWithName extends Role {
  name: string;
}

interface SwigContextType {
  roles: RoleWithName[];
  swigAddress: string | null;
  isSettingUp: boolean;
  isLoading: boolean;
  isAddingRole: boolean;
  error: string | null;
  permissionType: "locked" | "permissive";
  setPermissionType: (type: "locked" | "permissive") => void;
  setupSwigWallet: () => Promise<void>;
  getRoles: () => Promise<void>;
  addRole: (roleName: string, solAmount: string) => Promise<void>;
  getConnection: () => Promise<Connection>;
}

const SwigContext = createContext<SwigContextType | undefined>(undefined);

export function useSwigContext() {
  const context = useContext(SwigContext);
  if (!context) {
    throw new Error("useSwigContext must be used within a SwigProvider");
  }
  return context;
}

interface SwigProviderProps {
  children: ReactNode;
  walletAddress: string;
  walletType: "SOLANA" | "EVM";
}

export function SwigProvider({ children, walletAddress, walletType }: SwigProviderProps) {
  const [roles, setRoles] = useState<RoleWithName[]>([]);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [swigAddress, setSwigAddress] = useState<string | null>(null);
  const [permissionType, setPermissionType] = useState<"locked" | "permissive">("locked");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //this should read local storage key: swig_network and if set to localnet or devnet
  const getConnection = async (): Promise<Connection> => {
    const network = localStorage.getItem("swig_network") || "localnet";
    const endpoint =
      network === "devnet" ? "https://api.devnet.solana.com" : "http://localhost:8899";

    //console.log(`[getConnection] Using ${network} RPC: ${endpoint}`);
    return new Connection(endpoint, "confirmed");
  };

  //fetch swig address and roles
  const getSwigRoles = async () => {
    if (!swigAddress) return [];
    try {
      const connection = await getConnection();
      const swig = await fetchSwig(connection, new PublicKey(swigAddress));
      const fetchedRoles = swig.roles || [];

      if (fetchedRoles.length > roles.length) {
        const newRoles = fetchedRoles.map((role, index) => {
          const roleWithName = Object.create(Object.getPrototypeOf(role));
          Object.assign(roleWithName, role);
          roleWithName.name = index === 0 ? "Root Role" : `Role ${index}`;
          return roleWithName;
        }) as RoleWithName[];

        setRoles(newRoles);
        return newRoles;
      }

      return roles;
    } catch (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
  };

  const setupSwigWallet = async () => {
    if (!walletAddress) return;
    try {
      console.log("[setupSwigWallet] Starting Swig wallet setup…");
      setIsSettingUp(true);
      setError(null);
      const connection = await getConnection();
      let swigPdaBase58: string;
      if (walletType === "EVM") {
        //log permission type
        console.log("[setupSwigWallet] Permission type:", permissionType);
        /* Para-managed secp256k1 root */
        const {
          swigAddress,
          swigAddressSecret, // number[]
        } = await createSwigAccountSecpPara(connection, walletAddress, permissionType);

        swigPdaBase58 = swigAddress;

        /* store JSON array under the familiar key */
        localStorage.setItem("rootKeypair_0", JSON.stringify(swigAddressSecret));
        localStorage.removeItem("rootKeypair");
      } else {
        /* Ed25519 root (Solana wallet) */
        const { swigAddress, rootKeypairSecret } = await createSwigAccount(
          connection,
          permissionType
        );

        swigPdaBase58 = swigAddress.toBase58();

        localStorage.setItem("rootKeypair_0", JSON.stringify(rootKeypairSecret));
        localStorage.removeItem("rootKeypair");
      }
      console.log(`[setupSwigWallet] Airdropping 2 SOL to ${swigPdaBase58}…`);
      const airdropSig = await connection.requestAirdrop(
        new PublicKey(swigPdaBase58),
        2 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSig, "confirmed");
      console.log("[setupSwigWallet] Airdrop confirmed:", airdropSig);

      setSwigAddress(swigPdaBase58);
      console.log("[setupSwigWallet] Swig wallet ready at", swigPdaBase58);
    } catch (err) {
      console.error("Failed to set up Swig wallet:", err);
      setError("Failed to set up Swig wallet. Please try again.");
    } finally {
      setIsSettingUp(false);
    }
  };

  //fetch roles
  const getRoles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedRoles = await getSwigRoles();
      setRoles(fetchedRoles);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      setError("Failed to fetch roles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addRole = async (roleName: string, solAmount: string) => {
    if (!swigAddress || !solAmount || !roleName) return;

    let sig: string | null = null; // Declare outside to capture even on error
    let newKeypair: Keypair | undefined = undefined; // <-- Track newKeypair for SOLANA

    try {
      setIsAddingRole(true);
      setError(null);

      const connection = await getConnection();
      const swig = await fetchSwig(connection, new PublicKey(swigAddress));
      const rootRole = swig.roles.find((role) => role.actions.canManageAuthority());
      if (!rootRole) throw new Error("No role found with authority management permissions");

      const actions = Actions.set();
      const solAmountInLamports = BigInt(Number(solAmount) * LAMPORTS_PER_SOL);
      actions.solLimit({ amount: solAmountInLamports });

      const rootKeypairSecret = localStorage.getItem("rootKeypair_0");
      if (!rootKeypairSecret) throw new Error("Root keypair not found in localStorage");
      const rootKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(rootKeypairSecret)));

      let addAuthorityIx;

      if (walletType === "SOLANA") {
        newKeypair = Keypair.generate();
        const newAuthorityInfo = createEd25519AuthorityInfo(newKeypair.publicKey);

        const addAuthorityIxs = await getAddAuthorityInstructions(
          swig,
          rootRole.id,
          newAuthorityInfo,
          actions.get()
        );
        addAuthorityIx = addAuthorityIxs[0];
      } else {
        const currentWallet = await getEvmWalletPublicKey();
        if (!currentWallet) throw new Error("EVM public key not found");
        const hexPubkey = currentWallet.startsWith("0x") ? currentWallet.slice(2) : currentWallet;
        const currentWalletBytes = hexToBytes(hexPubkey);
        const newAuthorityInfo = createSecp256k1AuthorityInfo(currentWalletBytes);

        const instOptions: InstructionDataOptions = {
          currentSlot: BigInt(await connection.getSlot("finalized")),
          signingFn: async (msg: Uint8Array): Promise<{ signature: Uint8Array }> => {
            if (!walletAddress) throw new Error("No wallet address provided");

            //keccak256 hash the message
            const msgHash = keccak_256(msg);

            const base64Msg = Buffer.from(msgHash).toString("base64");
            const wallet = await para.findWalletByAddress(walletAddress);
            if (!wallet) throw new Error("Para wallet not found for this address");

            const res = await para.signMessage({
              walletId: wallet.id,
              messageBase64: base64Msg,
            });

            if ("signature" in res) {
              let sigBytes = Uint8Array.from(Buffer.from(res.signature, "hex"));

              if (sigBytes.length !== 65) {
                throw new Error(`EVM signature must be 65 bytes (got ${sigBytes.length})`);
              }

              // Ensure the signature is in the correct format
              sigBytes[64] = sigBytes[64] ? 28 : 27;

              return { signature: sigBytes };
            } else {
              throw new Error("Signature denied or not returned from Para");
            }
          },
        };

        const addAuthorityIxs = await getAddAuthorityInstructions(
          swig,
          rootRole.id,
          newAuthorityInfo,
          actions.get(),
          instOptions
        );
        addAuthorityIx = addAuthorityIxs[0];
      }

      const tx = new Transaction().add(addAuthorityIx);
      tx.feePayer = rootKeypair.publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.sign(rootKeypair);

      console.log(`[addRole] Sending transaction to add role...`);
      sig = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      console.log(`[addRole] Role creation confirmed. TX: ${sig}`);

      const updatedRoles = await getSwigRoles();
      const newRoles = updatedRoles.map((role, index) => {
        const roleWithName = Object.create(Object.getPrototypeOf(role));
        Object.assign(roleWithName, role);
        roleWithName.name =
          index === updatedRoles.length - 1
            ? roleName
            : index === 0
            ? "Root Role"
            : `Role ${index}`;
        return roleWithName;
      }) as RoleWithName[];

      setRoles(newRoles);
      // --- Save newKeypair to localStorage for SOLANA roles ---
      if (walletType === "SOLANA" && newKeypair) {
        const newRoleIndex = newRoles.length - 1;
        localStorage.setItem(
          `roleKeypair_${newRoleIndex}`,
          JSON.stringify(Array.from(newKeypair.secretKey))
        );
      }
    } catch (error) {
      console.error("Failed to add role:", error);
      if (sig) {
        console.error(`[addRole] Transaction may have been sent. TX: ${sig}`);
      }
      setError("Failed to add role. Please try again.");
    } finally {
      setIsAddingRole(false);
    }
  };

  const value: SwigContextType = {
    roles,
    swigAddress,
    isSettingUp,
    isLoading,
    isAddingRole,
    error,
    permissionType,
    setPermissionType,
    setupSwigWallet,
    getRoles,
    getConnection,
    addRole,
  };

  return <SwigContext.Provider value={value}>{children}</SwigContext.Provider>;
}
