import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import {
  Actions,
  Ed25519Authority,
  fetchSwig,
  addAuthorityInstruction,
} from "@swig-wallet/classic";
import { sendTransaction } from "./transactions";

export interface RolePermissions {
  canManageAuthority?: boolean;
  solLimit?: number;
}

export async function fetchSwigRoles(connection: Connection, swigAddress: PublicKey) {
  const swig = await fetchSwig(connection, swigAddress);
  return swig.roles;
}

export async function addNewRole(
  connection: Connection,
  swigAddress: PublicKey,
  rootAuthority: Ed25519Authority,
  rootKeypair: Keypair,
  newAuthorityKeypair: Keypair,
  permissions: RolePermissions
) {
  const swig = await fetchSwig(connection, swigAddress);
  const rootRole = swig.findRoleByAuthority(rootAuthority);

  if (!rootRole) {
    throw new Error("Root role not found");
  }

  const newAuthority = Ed25519Authority.fromPublicKey(newAuthorityKeypair.publicKey);
  const actions = Actions.set();

  if (permissions.canManageAuthority) {
    actions.manageAuthority();
  }

  if (permissions.solLimit) {
    actions.solLimit({ amount: BigInt(permissions.solLimit) });
  }

  const addAuthorityIx = await addAuthorityInstruction(
    rootRole,
    rootKeypair.publicKey,
    newAuthority,
    actions.get()
  );

  await sendTransaction(connection, addAuthorityIx, rootKeypair);
  await swig.refetch(connection);

  return swig.roles;
}
