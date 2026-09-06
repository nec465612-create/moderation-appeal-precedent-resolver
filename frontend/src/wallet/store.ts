import { useSyncExternalStore } from "react";
import type { ChainConfiguration, HexAddress, WalletProviderDetail, WalletSession } from "./types";

export type WalletPhase = "DISCONNECTED" | "DISCOVERING" | "CHOOSER_OPEN" | "CONNECTING" | "CONNECTED" | "WRONG_CHAIN" | "ERROR";
export interface WalletState<T> { phase: WalletPhase; providers: readonly WalletProviderDetail[]; session?: WalletSession; writeClient?: T; error?: string }

function address(value: unknown): HexAddress {
  const candidate = String(value ?? "");
  if (!/^0x[0-9a-fA-F]{40}$/.test(candidate)) throw new Error("The selected wallet did not return a valid account.");
  return candidate as HexAddress;
}

function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? Number((error as { code: unknown }).code) : undefined;
}

export function createWalletStore<T>(options: { chain: ChainConfiguration; bind(session: WalletSession): T }) {
  let state: WalletState<T> = Object.freeze({ phase: "DISCONNECTED", providers: [] });
  const subscribers = new Set<() => void>();
  let teardown = () => {};
  let generation = 0;
  const commit = (next: WalletState<T>) => { state = Object.freeze(next); subscribers.forEach((fn) => fn()); };
  const disconnect = () => { generation += 1; teardown(); teardown = () => {}; commit({ phase: "DISCONNECTED", providers: state.providers }); };

  function install(session: WalletSession) {
    generation += 1;
    teardown();
    const token = generation;
    const provider = session.detail.provider;
    const accountsChanged = async (input: unknown) => {
      if (token !== generation) return;
      const accounts = Array.isArray(input) ? input : [];
      if (!accounts.length) return disconnect();
      const next = { ...session, address: address(accounts[0]) };
      const chainId = String(await provider.request({ method: "eth_chainId" })).toLowerCase();
      if (token !== generation) return;
      commit(chainId === options.chain.chainIdHex.toLowerCase()
        ? { phase: "CONNECTED", providers: state.providers, session: next, writeClient: options.bind(next) }
        : { phase: "WRONG_CHAIN", providers: state.providers, session: next, error: "Switch to the supported network." });
    };
    const chainChanged = (input: unknown) => {
      if (token !== generation) return;
      const next = String(input).toLowerCase() === options.chain.chainIdHex.toLowerCase()
        ? { phase: "CONNECTED" as const, providers: state.providers, session, writeClient: options.bind(session) }
        : { phase: "WRONG_CHAIN" as const, providers: state.providers, session, error: "Switch to the supported network." };
      commit(next);
    };
    provider.on?.("accountsChanged", accountsChanged);
    provider.on?.("chainChanged", chainChanged);
    provider.on?.("disconnect", disconnect);
    teardown = () => {
      provider.removeListener?.("accountsChanged", accountsChanged);
      provider.removeListener?.("chainChanged", chainChanged);
      provider.removeListener?.("disconnect", disconnect);
    };
  }

  return {
    get: () => state,
    subscribe(fn: () => void) { subscribers.add(fn); return () => subscribers.delete(fn); },
    setProviders(providers: readonly WalletProviderDetail[]) { commit({ ...state, providers }); },
    open(requestDiscovery: () => void) { disconnect(); commit({ phase: "DISCOVERING", providers: state.providers }); requestDiscovery(); commit({ phase: "CHOOSER_OPEN", providers: state.providers }); },
    close() { if (["CHOOSER_OPEN", "ERROR"].includes(state.phase)) disconnect(); },
    async connect(detail: WalletProviderDetail) {
      if (state.phase === "CONNECTING") return;
      const selected = state.providers.find((item) => item.walletId === detail.walletId && item.provider === detail.provider);
      if (!selected) return commit({ phase: "ERROR", providers: state.providers, error: "That wallet is no longer available." });
      const attempt = ++generation;
      teardown();
      commit({ phase: "CONNECTING", providers: state.providers });
      try {
        const accounts = await selected.provider.request({ method: "eth_requestAccounts" });
        const session = { detail: selected, address: address(Array.isArray(accounts) ? accounts[0] : undefined) };
        try {
          await selected.provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: options.chain.chainIdHex }] });
        } catch (cause) {
          if (errorCode(cause) !== 4902) throw cause;
          await selected.provider.request({ method: "wallet_addEthereumChain", params: [{ chainId: options.chain.chainIdHex, chainName: options.chain.name, nativeCurrency: options.chain.nativeCurrency, rpcUrls: [options.chain.rpcUrl], blockExplorerUrls: options.chain.explorerUrl ? [options.chain.explorerUrl] : undefined }] });
          await selected.provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: options.chain.chainIdHex }] });
        }
        const [currentAccounts, currentChain] = await Promise.all([
          selected.provider.request({ method: "eth_accounts" }),
          selected.provider.request({ method: "eth_chainId" }),
        ]);
        if (attempt !== generation || address(Array.isArray(currentAccounts) ? currentAccounts[0] : undefined).toLowerCase() !== session.address.toLowerCase()) return;
        if (String(currentChain).toLowerCase() !== options.chain.chainIdHex.toLowerCase()) throw new Error("The selected wallet is on the wrong network.");
        install(session);
        commit({ phase: "CONNECTED", providers: state.providers, session, writeClient: options.bind(session) });
      } catch (cause) {
        if (attempt === generation) commit({ phase: "ERROR", providers: state.providers, error: cause instanceof Error ? cause.message : "The wallet could not connect." });
      }
    },
    disconnect,
  };
}

export function walletView<T>(state: WalletState<T>) {
  const connected = state.phase === "CONNECTED";
  return {
    connected,
    chooserOpen: ["CHOOSER_OPEN", "CONNECTING", "ERROR"].includes(state.phase),
    canWrite: connected && Boolean(state.writeClient),
    action: connected ? "Disconnect" : state.phase === "WRONG_CHAIN" ? "Switch wallet" : "Connect wallet",
    badge: connected && state.session ? `${state.session.detail.info.name} · ${state.session.address.slice(0, 6)}…${state.session.address.slice(-4)}` : state.phase === "WRONG_CHAIN" ? "Wrong network" : "Disconnected",
  } as const;
}

export function useWallet<T>(store: { get(): WalletState<T>; subscribe(fn: () => void): () => void }) {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
