import { useSyncExternalStore } from "react";
import type { Eip1193Provider, SupportedWalletId, WalletProviderDetail } from "./types";

declare global {
  interface Window { ethereum?: Eip1193Provider; okxwallet?: Eip1193Provider }
}

const WALLETS = [
  { id: "okx", name: "OKX Wallet", rdns: ["com.okex.wallet", "com.okx.wallet"], icon: "/wallets/okx.svg" },
  { id: "metamask", name: "MetaMask", rdns: ["io.metamask"], icon: "/wallets/metamask.svg" },
  { id: "rabby", name: "Rabby", rdns: ["io.rabby"], icon: "/wallets/rabby.svg" },
] as const;
const registry = new Map<SupportedWalletId, WalletProviderDetail>();
const uuidProviders = new Map<string, Eip1193Provider>();
const providerWallets = new WeakMap<object, SupportedWalletId>();
const listeners = new Set<() => void>();
const EMPTY: readonly WalletProviderDetail[] = Object.freeze([]);
let snapshot = EMPTY;
let initialized = false;

function isProvider(value: unknown): value is Eip1193Provider {
  return Boolean(value && typeof value === "object" && typeof (value as Eip1193Provider).request === "function");
}

function legacyIdentity(provider: Eip1193Provider) {
  const ids: SupportedWalletId[] = [];
  if (provider.isMetaMask === true) ids.push("metamask");
  if (provider.isRabby === true) ids.push("rabby");
  if (provider.isOkxWallet === true || provider.isOKExWallet === true) ids.push("okx");
  return ids.length === 1 ? WALLETS.find((wallet) => wallet.id === ids[0]) : undefined;
}

function publish() {
  snapshot = Object.freeze(WALLETS.flatMap(({ id }) => registry.get(id) ? [registry.get(id)!] : []));
  listeners.forEach((listener) => listener());
}

function accept(info: WalletProviderDetail["info"], provider: Eip1193Provider, legacy = false) {
  const wallet = legacy ? legacyIdentity(provider) : WALLETS.find(({ rdns }) => rdns.includes(info.rdns.toLowerCase() as never));
  if (!wallet || !info.uuid || !isProvider(provider)) return;
  const priorUuid = uuidProviders.get(info.uuid);
  const priorWallet = providerWallets.get(provider as object);
  const current = registry.get(wallet.id);
  if ((priorUuid && priorUuid !== provider) || (priorWallet && priorWallet !== wallet.id) || (current && current.provider !== provider && !current.legacy)) return;
  uuidProviders.set(info.uuid, provider);
  providerWallets.set(provider as object, wallet.id);
  registry.set(wallet.id, {
    walletId: wallet.id,
    legacy,
    provider,
    info: { uuid: info.uuid, rdns: info.rdns, name: wallet.name, icon: wallet.icon },
  });
  publish();
}

function announce(event: Event) {
  const detail = (event as CustomEvent<{ info?: WalletProviderDetail["info"]; provider?: Eip1193Provider }>).detail;
  if (!detail?.info || !detail.info.icon.startsWith("data:") || !isProvider(detail.provider)) return;
  accept(detail.info, detail.provider);
}

export function ensureProviderDiscovery() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.addEventListener("eip6963:announceProvider", announce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  queueMicrotask(() => {
    const candidates = [...(window.ethereum?.providers ?? []), window.ethereum, window.okxwallet].filter(isProvider);
    for (const provider of new Set(candidates)) {
      const wallet = legacyIdentity(provider);
      if (!wallet || registry.has(wallet.id)) continue;
      accept({ uuid: `legacy-${wallet.id}`, name: wallet.name, icon: wallet.icon, rdns: wallet.rdns[0] }, provider, true);
    }
  });
}

export function getProviderSnapshot() { return snapshot; }
export function useProviders() {
  ensureProviderDiscovery();
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    getProviderSnapshot,
    () => EMPTY,
  );
}

export function resetProviderRegistryForTests() {
  registry.clear();
  uuidProviders.clear();
  snapshot = EMPTY;
  initialized = false;
}
