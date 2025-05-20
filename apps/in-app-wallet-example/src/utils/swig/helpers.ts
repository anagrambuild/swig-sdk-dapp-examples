import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const formatSolLimit = (limit: bigint | null): string => {
  return limit === null ? "unlimited" : `${Number(limit) / LAMPORTS_PER_SOL} SOL`;
};
