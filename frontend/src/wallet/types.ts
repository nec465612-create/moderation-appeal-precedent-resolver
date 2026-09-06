export type HexAddress = `0x${string}`;
export type SupportedWalletId = "metamask" | "okx" | "rabby";

export interface Eip1193Provider {
  request(args: { method: string; params?: readonly unknown[] | object }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
  readonly providers?: readonly Eip1193Provider[];
  readonly isMetaMask?: boolean;
  readonly isRabby?: boolean;
  readonly isOkxWallet?: boolean;
  readonly isOKExWallet?: boolean;
}

export interface WalletProviderDetail {
  walletId: SupportedWalletId;
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: Eip1193Provider;
  legacy?: boolean;
}

export interface WalletSession {
  address: HexAddress;
  detail: WalletProviderDetail;
}

export interface ChainConfiguration {
  id: number;
  chainIdHex: `0x${string}`;
  name: string;
  rpcUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  explorerUrl?: string;
}
