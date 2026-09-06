import { createClient } from "genlayer-js";
import type { Eip1193Provider, HexAddress, WalletSession } from "./wallet/types";
import { CHAIN, CONTRACT_ADDRESS } from "./config";

export interface Registry { authority: HexAddress; revision: string; count: string }
export interface Precedent { id: string; rule_id: string; text: string; original_disposition: "REMOVED"; holding: "UPHOLD" | "REVERSE"; active: boolean; added_revision: string; retired_revision: string }
export interface AppealRecord {
  id: string;
  primary: HexAddress;
  secondary: HexAddress;
  phase: string;
  revision: string;
  base: { rule_id: string; original_disposition: "REMOVED"; content: string; rationale: string };
  outcome: string;
  result: { v?: 1; labels?: string[] };
  domain: { snapshot_revision: string; snapshot: Precedent[] };
}

function requireConfig() {
  if (!CHAIN || !CONTRACT_ADDRESS) throw new Error("The verified Studionet contract configuration is not available yet.");
  return { chain: CHAIN, address: CONTRACT_ADDRESS };
}

function chain() {
  const { chain } = requireConfig();
  return {
    id: chain.id,
    name: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: { default: { http: [chain.rpcUrl] as readonly string[] } },
    blockExplorers: chain.explorerUrl ? { default: { name: "GenLayer Explorer", url: chain.explorerUrl } } : undefined,
  } satisfies Parameters<typeof createClient>[0] extends infer T ? NonNullable<T> extends { chain?: infer C } ? C : never : never;
}

let publicClient: ReturnType<typeof createClient> | undefined;
const readClient = () => publicClient ??= createClient({ chain: chain(), endpoint: requireConfig().chain.rpcUrl });
export function writeClient(session: WalletSession) {
  return createClient({ chain: chain(), endpoint: requireConfig().chain.rpcUrl, account: session.address, provider: session.detail.provider as unknown as Eip1193Provider });
}

function parse<T>(value: unknown): T {
  if (typeof value !== "string") throw new Error("Contract returned an invalid JSON boundary.");
  return JSON.parse(value) as T;
}

async function read(functionName: string, args: unknown[] = []) {
  return readClient().readContract({ address: requireConfig().address, functionName, args: args as never[] });
}

export async function getRegistry() { return parse<Registry>(await read("get_registry")); }
export async function getPrecedent(id: string) { return parse<Precedent | null>(await read("get_precedent", [BigInt(id)])); }
export async function getAppeal(id: string) { return parse<AppealRecord | null>(await read("get_case", [BigInt(id)])); }
export async function getVersion(id: string, revision: string) { return parse<AppealRecord | null>(await read("get_version", [BigInt(id), BigInt(revision)])); }
export async function getIdByNonce(creator: HexAddress, nonce: string) { return String(await read("get_id_by_nonce", [creator, nonce])); }
export async function listCases(start = "1") { return parse<{ ids: string[]; next: string }>(await read("list_cases", [BigInt(start), 4n])); }
export async function listPrecedents(ruleId: string, offset = "0") { return parse<{ ids: string[]; next: string }>(await read("list_precedents", [ruleId, BigInt(offset), 4n])); }

export async function submit(session: WalletSession, method: string, args: unknown[]) {
  const result = await writeClient(session).writeContract({
    address: requireConfig().address,
    functionName: method,
    args: args as never[],
    value: 0n,
  });
  const hash = typeof result === "string" ? result : result?.hash ?? result?.txId;
  if (!/^0x[0-9a-fA-F]{64}$/.test(String(hash ?? ""))) throw new Error("The wallet did not return a valid transaction hash.");
  return hash as `0x${string}`;
}

export async function finalized(hash: `0x${string}`) {
  return readClient().waitForTransactionReceipt({ hash: hash as never, status: "FINALIZED" as never, interval: 4000, retries: 3 });
}

export function assertSuccessful(receipt: unknown) {
  const value = receipt as { statusName?: unknown; txExecutionResultName?: unknown };
  if (value.statusName !== "FINALIZED") throw new Error("Finality is not verified.");
  if (value.txExecutionResultName !== "FINISHED_WITH_RETURN") throw new Error("The finalized transaction did not execute successfully.");
}

export const contractAddress = () => requireConfig().address;
