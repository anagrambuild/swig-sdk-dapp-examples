import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import {
  Actions,
  createEd25519AuthorityInfo,
  fetchSwig,
  getAddAuthorityInstructions,
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
  rootAuthorityPublicKey: PublicKey,
  rootKeypair: Keypair,
  newAuthorityKeypair: Keypair,
  permissions: RolePermissions
) {
  const swig = await fetchSwig(connection, swigAddress);
  const rootRoles = swig.findRolesByEd25519SignerPk(rootAuthorityPublicKey);

  if (rootRoles.length === 0) {
    throw new Error("Root role not found");
  }

  const rootRole = rootRoles[0];
  const newAuthorityInfo = createEd25519AuthorityInfo(newAuthorityKeypair.publicKey);
  const actions = Actions.set();

  if (permissions.canManageAuthority) {
    actions.manageAuthority();
  }

  if (permissions.solLimit) {
    actions.solLimit({ amount: BigInt(permissions.solLimit) });
  }

  const addAuthorityIxs = await getAddAuthorityInstructions(
    swig,
    rootRole.id,
    newAuthorityInfo,
    actions.get()
  );

  await sendTransaction(connection, addAuthorityIxs[0], rootKeypair);
  await swig.refetch();

  return swig.roles;
}
