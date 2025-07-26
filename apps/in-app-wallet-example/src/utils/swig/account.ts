import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { fetchSwig } from '@swig-wallet/classic';
  // import { createEd25519AuthorityInfo, fetchSwig } from '@swig-wallet/classic';

export interface SwigAccountState {
  swigAddress: PublicKey;
  rootAuthorityPublicKey: PublicKey;
  rootKeypair: Keypair;
  roles: any[];
  balance: number;
}

export async function getSwigAccountState(
  connection: Connection,
  swigAddress: PublicKey,
  rootAuthorityPublicKey: PublicKey,
  rootKeypair: Keypair
): Promise<SwigAccountState> {
  const swig = await fetchSwig(connection, swigAddress);
  const balance = await connection.getBalance(swigAddress);

  return {
    swigAddress,
    rootAuthorityPublicKey,
    rootKeypair,
    roles: swig.roles,
    balance: balance / LAMPORTS_PER_SOL,
  };
}

export async function refreshSwigAccount(
  connection: Connection,
  swigAddress: PublicKey
) {
  const swig = await fetchSwig(connection, swigAddress);
  await swig.refetch();
  return swig;
}

export function createAuthorityFromKeypair(keypair: Keypair): PublicKey {
  return keypair.publicKey;
}

export function generateNewAuthority(): {
  authorityPublicKey: PublicKey;
  keypair: Keypair;
} {
  const keypair = Keypair.generate();
  const authorityPublicKey = keypair.publicKey;
  return { authorityPublicKey, keypair };
}
