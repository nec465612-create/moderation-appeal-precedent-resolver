import type { ChainConfiguration, HexAddress } from "./wallet/types";

const address = import.meta.env.VITE_CONTRACT_ADDRESS ?? "";
const chainId = Number(import.meta.env.VITE_CHAIN_ID ?? "0");
const rpcUrl = import.meta.env.VITE_RPC_URL ?? "";

export const CONTRACT_ADDRESS = /^0x[0-9a-fA-F]{40}$/.test(address) ? address.toLowerCase() as HexAddress : undefined;
export const CHAIN: ChainConfiguration | undefined = Number.isSafeInteger(chainId) && chainId > 0 && rpcUrl
  ? {
      id: chainId,
      chainIdHex: `0x${chainId.toString(16)}`,
      name: import.meta.env.VITE_CHAIN_NAME ?? "GenLayer Studionet",
      rpcUrl,
      nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
      explorerUrl: import.meta.env.VITE_EXPLORER_URL || undefined,
    }
  : undefined;

export const CONFIGURED = Boolean(CONTRACT_ADDRESS && CHAIN);
