import { describe, expect, it, vi } from "vitest";
import { createWalletStore, walletView } from "../src/wallet/store";
import type { Eip1193Provider, WalletProviderDetail } from "../src/wallet/types";

const ADDRESS = `0x${"1".repeat(40)}` as const;
const CHAIN = { id: 1, chainIdHex: "0x1" as const, name: "Test", rpcUrl: "https://rpc.example", nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 } };

function wallet(id: "metamask" | "okx" | "rabby", calls: string[] = []): WalletProviderDetail {
  const provider: Eip1193Provider = {
    async request({ method }) {
      calls.push(method);
      if (method === "eth_requestAccounts" || method === "eth_accounts") return [ADDRESS];
      if (method === "eth_chainId") return CHAIN.chainIdHex;
      return null;
    },
    on: vi.fn(),
    removeListener: vi.fn(),
  };
  return { walletId: id, provider, info: { uuid: id, name: id, icon: `/wallets/${id}.svg`, rdns: id } };
}

describe("canonical wallet store", () => {
  it.each([[0, []], [1, [wallet("metamask")]], [2, [wallet("okx"), wallet("rabby")]], [3, [wallet("metamask"), wallet("okx"), wallet("rabby")]]])("renders exactly %i discovered providers", (count, providers) => {
    const store = createWalletStore({ chain: CHAIN, bind: () => ({}) });
    store.setProviders(providers as WalletProviderDetail[]);
    expect(store.get().providers).toHaveLength(count as number);
  });

  it("contacts only the explicitly selected provider and commits atomically", async () => {
    const firstCalls: string[] = [];
    const secondCalls: string[] = [];
    const first = wallet("metamask", firstCalls);
    const second = wallet("okx", secondCalls);
    const client = { provider: second.provider };
    const store = createWalletStore({ chain: CHAIN, bind: () => client });
    store.setProviders([first, second]);
    await store.connect(second);
    expect(firstCalls).toEqual([]);
    expect(secondCalls).toContain("eth_requestAccounts");
    expect(store.get()).toMatchObject({ phase: "CONNECTED", writeClient: client, session: { address: ADDRESS } });
    expect(walletView(store.get())).toMatchObject({ connected: true, canWrite: true, action: "Disconnect" });
  });

  it("never contacts a stale provider object", async () => {
    const registered = wallet("rabby");
    const staleCalls: string[] = [];
    const stale = wallet("rabby", staleCalls);
    const store = createWalletStore({ chain: CHAIN, bind: () => ({}) });
    store.setProviders([registered]);
    await store.connect(stale);
    expect(staleCalls).toEqual([]);
    expect(walletView(store.get()).canWrite).toBe(false);
  });
});
