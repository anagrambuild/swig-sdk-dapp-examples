import { createContext, useContext, useState, ReactNode } from "react";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  Keypair,
  SystemProgram,
} from "@solana/web3.js";
import {
  fetchSwig,
  Role,
  Actions,
  Ed25519Authority,
  addAuthorityInstruction,
} from "@swig-wallet/classic";
import { createSwigAccount } from "../utils/swig";

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
  walletAddress?: string;
}

export function SwigProvider({ children, walletAddress }: SwigProviderProps) {
  const [roles, setRoles] = useState<RoleWithName[]>([]);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [swigAddress, setSwigAddress] = useState<string | null>(null);
  const [permissionType, setPermissionType] = useState<"locked" | "permissive">("locked");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = {
    publicKey: walletAddress ? new PublicKey(walletAddress) : null,
    signTransaction: async (tx: Transaction) => {
      return tx;
    },
  };

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
    if (!wallet.publicKey) return;

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
      if (!rootRole) {
        throw new Error("No role found with authority management permissions");
      }

      const newKeypair = Keypair.generate();
      const newAuthority = Ed25519Authority.fromPublicKey(newKeypair.publicKey);

      const actions = Actions.set();
      const solAmountInLamports = BigInt(Number(solAmount) * LAMPORTS_PER_SOL);
      actions.solLimit({ amount: solAmountInLamports });

      const rootKeypairSecret = localStorage.getItem("rootKeypair");
      if (!rootKeypairSecret) {
        throw new Error("Root keypair not found");
      }
      const rootKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(rootKeypairSecret)));

      // First check if root authority has enough SOL
      const rootBalance = await connection.getBalance(rootKeypair.publicKey);
      if (rootBalance < Number(solAmountInLamports)) {
        throw new Error("Root authority does not have enough SOL to fund this role");
      }

      // Create a transaction that includes both the role creation and SOL transfer
      const transaction = new Transaction();

      // Add the authority instruction first
      const addAuthorityIx = await addAuthorityInstruction(
        rootRole,
        rootKeypair.publicKey,
        newAuthority,
        actions.get()
      );
      transaction.add(addAuthorityIx);

      // Then add the transfer instruction to fund the Swig wallet
      const transferIx = SystemProgram.transfer({
        fromPubkey: rootKeypair.publicKey,
        toPubkey: new PublicKey(swigAddress),
        lamports: Number(solAmountInLamports),
      });
      transaction.add(transferIx);

      // Set up transaction
      transaction.feePayer = rootKeypair.publicKey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // Sign and send the transaction
      transaction.sign(rootKeypair);
      const signature = await connection.sendRawTransaction(transaction.serialize());

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      console.log(`Role created and funded with ${solAmount} SOL`);

      const updatedRoles = await getSwigRoles();
      const newRoles = updatedRoles.map((role, index) => {
        const roleWithName = Object.create(Object.getPrototypeOf(role));
        Object.assign(roleWithName, role);
        if (index === updatedRoles.length - 1) {
          roleWithName.name = roleName;
        } else {
          roleWithName.name = roleWithName.name || (index === 0 ? "Root Role" : `Role ${index}`);
        }
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

  const value = {
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
