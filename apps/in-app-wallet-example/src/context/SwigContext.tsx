import { createContext, useContext, useState, ReactNode } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, Keypair } from "@solana/web3.js";
import {
  fetchSwig,
  Role,
  Actions,
  Ed25519Authority,
  Secp256k1Authority,
  addAuthorityInstruction,
  type InstructionDataOptions,
} from "@swig-wallet/classic";
import { para } from "../client/para";
import { createSwigAccount } from "../utils/swig";
import { hexToBytes } from "@noble/curves/abstract/utils";
import { getEvmWalletPublicKey } from "../utils/evm/publickey";
import { createSwigAccountSecpPara } from "../utils/swig/createSwigAccountSecp";

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

  //fetch swig address and roles
  const getSwigRoles = async () => {
    if (!swigAddress) return [];
    try {
      const connection = new Connection("http://localhost:8899", "confirmed");
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
      const connection = new Connection("http://localhost:8899", "confirmed");
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
        localStorage.setItem("rootKeypair", JSON.stringify(swigAddressSecret));
      } else {
        /* Ed25519 root (Solana wallet) */
        const { swigAddress, rootKeypairSecret } = await createSwigAccount(
          connection,
          permissionType
        );

        swigPdaBase58 = swigAddress.toBase58();

        localStorage.setItem("rootKeypair", JSON.stringify(rootKeypairSecret));
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
  
    try {
      setIsAddingRole(true);
      setError(null);
      console.log(`[addRole] Adding role: ${roleName} with ${solAmount} SOL`);
  
      const connection = new Connection("http://localhost:8899", "confirmed");
      const swig = await fetchSwig(connection, new PublicKey(swigAddress));
      const rootRole = swig.roles.find((role) => role.canManageAuthority());
      if (!rootRole) throw new Error("No role found with authority management permissions");
  
      const actions = Actions.set();
      const solAmountInLamports = BigInt(Number(solAmount) * LAMPORTS_PER_SOL);
      actions.solLimit({ amount: solAmountInLamports });
      console.log(`[addRole] Setting SOL limit: ${solAmountInLamports.toString()} lamports`);
  
      const rootKeypairSecret = localStorage.getItem("rootKeypair");
      if (!rootKeypairSecret) throw new Error("Root keypair not found in localStorage");
      const rootKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(rootKeypairSecret)));
  
      let addAuthorityIx;
  
      if (walletType === "SOLANA") {
        const newKeypair = Keypair.generate();
        console.log(`[addRole] Generated new Ed25519 keypair: ${newKeypair.publicKey.toBase58()}`);
        const newAuthority = Ed25519Authority.fromPublicKey(newKeypair.publicKey);
  
        addAuthorityIx = await addAuthorityInstruction(
          rootRole,
          rootKeypair.publicKey,
          newAuthority,
          actions.get()
        );
      } else {
        const currentWallet = await getEvmWalletPublicKey();
        if (!currentWallet) throw new Error("EVM public key not found");
        const hexPubkey = currentWallet.startsWith("0x") ? currentWallet.slice(2) : currentWallet;
        const currentWalletBytes = hexToBytes(hexPubkey);
        console.log(`[addRole] Using EVM wallet public key: 0x${hexPubkey}`);
        const newAuthority = Secp256k1Authority.fromPublicKeyBytes(currentWalletBytes);
        console.log(`[addRole] Generated new Secp256k1 keypair: ${newAuthority.toString()}`);
  
        const instOptions: InstructionDataOptions = {
        currentSlot: BigInt(await connection.getSlot('finalized')),
        signingFn: async (msg: Uint8Array): Promise<Uint8Array> => {
            if (!walletAddress) throw new Error("No wallet address provided");
          
            const base64Msg = Buffer.from(msg).toString("base64");
            const wallet = await para.findWalletByAddress(walletAddress);
            if (!wallet) throw new Error("Para wallet not found for this address");
          
            const res = await para.signMessage({
              walletId: wallet.id,
              messageBase64: base64Msg
            });

            //console.log("wallet id", wallet.id)
          
            if ("signature" in res) {
              // decode based on what encoding you used
              let sigBytes = Uint8Array.from(Buffer.from(res.signature, "hex"));
              console.log("res sig", res.signature)
              console.log("sigBytes", sigBytes)
              let _sigBytes = hexToBytes(res.signature)
              console.log("sigBytes hex", _sigBytes)
              if (sigBytes.length !== 65) {
                throw new Error(`EVM signature must be 65 bytes (got ${sigBytes.length})`);
              }
          
              console.log("[transfer] Got 65-byte signature via Para");
              return sigBytes;
            } else {
              throw new Error("Signature denied or not returned from Para");
            }
          }          
      };
  
  
        addAuthorityIx = await addAuthorityInstruction(
          rootRole,
          rootKeypair.publicKey,
          newAuthority,
          actions.get(),
          instOptions
        );
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
    addRole,
  };

  return <SwigContext.Provider value={value}>{children}</SwigContext.Provider>;
}
