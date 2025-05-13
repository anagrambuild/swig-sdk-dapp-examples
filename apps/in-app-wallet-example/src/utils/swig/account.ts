import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { Ed25519Authority, fetchSwig } from '@swig-wallet/classic';

export interface SwigAccountState {
  swigAddress: PublicKey;
  rootAuthority: Ed25519Authority;
  rootKeypair: Keypair;
  roles: any[];
  balance: number;
}

export async function getSwigAccountState(
  connection: Connection,
  swigAddress: PublicKey,
  rootAuthority: Ed25519Authority,
  rootKeypair: Keypair
): Promise<SwigAccountState> {
  const swig = await fetchSwig(connection, swigAddress);
  const balance = await connection.getBalance(swigAddress);

  return {
    swigAddress,
    rootAuthority,
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
  await swig.refetch(connection);
  return swig;
}

export function createAuthorityFromKeypair(keypair: Keypair): Ed25519Authority {
  return Ed25519Authority.fromPublicKey(keypair.publicKey);
}

export function generateNewAuthority(): {
  authority: Ed25519Authority;
  keypair: Keypair;
} {
  const keypair = Keypair.generate();
  const authority = Ed25519Authority.fromPublicKey(keypair.publicKey);
  return { authority, keypair };
}
