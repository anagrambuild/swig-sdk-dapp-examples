import {
    createContext,
    useContext,
    useState,
    ReactNode,
  } from "react";
  import {
    Connection,
    PublicKey,
    Transaction,
    Keypair,
  } from "@solana/web3.js";
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
  import { bytesToHex } from "@noble/curves/abstract/utils";
  import { getEvmWalletPublicKey } from "../utils/evm/publickey";
  
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
        setIsSettingUp(true);
        setError(null);
        const connection = new Connection("http://localhost:8899", "confirmed");
        const { swigAddress: newSwigAddress, rootKeypairSecret } = await createSwigAccount(
          connection,
          permissionType
        );
        setSwigAddress(newSwigAddress.toBase58());
        localStorage.setItem("rootKeypair", JSON.stringify(rootKeypairSecret));
      } catch (error) {
        console.error("Failed to set up Swig wallet:", error);
        setError("Failed to set up Swig wallet. Please try again.");
      } finally {
        setIsSettingUp(false);
      }
    };
  
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
  
      try {
        setIsAddingRole(true);
        setError(null);
  
        const connection = new Connection("http://localhost:8899", "confirmed");
        const swig = await fetchSwig(connection, new PublicKey(swigAddress));
  
        const rootRole = swig.roles.find((role) => role.canManageAuthority());
        if (!rootRole) throw new Error("No role found with authority management permissions");
  
        const actions = Actions.set();
        actions.solLimit({ amount: BigInt(Number(solAmount) * 1_000_000_000) });
  
        const rootKeypairSecret = localStorage.getItem("rootKeypair");
        if (!rootKeypairSecret) throw new Error("Root keypair not found in localStorage");
        const rootKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(rootKeypairSecret)));
  
        let addAuthorityIx;
  
        if (walletType === "SOLANA") {
          const newKeypair = Keypair.generate();
          const newAuthority = Ed25519Authority.fromPublicKey(newKeypair.publicKey);
  
          addAuthorityIx = await addAuthorityInstruction(
            rootRole,
            rootKeypair.publicKey,
            newAuthority,
            actions.get()
          );
        } else {
          //const currentWallet = "0x040bf2394f3b0d3cf4e13def63c48d8b47006cafe64e516b4cb8b18168df791c5deab1c5c0332a8078f54ed2f41d692a85308cd93a39dcf604dc661c53bc4411d1"
          const currentWallet = await getEvmWalletPublicKey();
          if (!currentWallet) throw new Error("EVM public key not found");
          const hexPubkey = currentWallet.startsWith("0x") ? currentWallet.slice(2) : currentWallet;
          const currentWalletBytes = hexToBytes(hexPubkey);
          const newAuthority = Secp256k1Authority.fromPublicKeyBytes(currentWalletBytes);
  
  
  
          const instOptions: InstructionDataOptions = {
            currentSlot: BigInt(await connection.getSlot("finalized")),
            signingFn: async (msg: Uint8Array): Promise<Uint8Array> => {
              const res = await para.signMessage({
                walletId: walletAddress,
                messageBase64: Buffer.from(msg).toString("base64"),
              });
  
              if ("signature" in res) {
                return Uint8Array.from(Buffer.from(res.signature, "base64"));
              } else {
                throw new Error("Signature denied or not returned");
              }
            },
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
        await connection.sendRawTransaction(tx.serialize());
  
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
  