import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProductIntro } from "../src/components/ProductIntro";
import { Navigation } from "../src/components/Navigation";
import { RegistryWorkspace } from "../src/components/RegistryWorkspace";
import { AppealsWorkspace } from "../src/components/AppealsWorkspace";
import { TransactionHUD } from "../src/components/TransactionHUD";
import { Documentation } from "../src/components/Documentation";
import { WalletDialog } from "../src/components/WalletDialog";
import type { AppealRecord, Precedent, Registry } from "../src/contract";
import type { WalletProviderDetail } from "../src/wallet/types";

afterEach(() => {
  cleanup();
});

const MOCK_REGISTRY: Registry = {
  authority: "0x1111111111111111111111111111111111111111",
  revision: "4",
  count: "3",
};

const MOCK_PRECEDENTS: Precedent[] = [
  {
    id: "1",
    rule_id: "harassment",
    text: "Targeted repetition of defamatory statements without new evidentiary value.",
    original_disposition: "REMOVED",
    holding: "UPHOLD",
    active: true,
    added_revision: "1",
    retired_revision: "0",
  },
  {
    id: "2",
    rule_id: "harassment",
    text: "Good-faith investigative reporting quoting third-party public transcripts.",
    original_disposition: "REMOVED",
    holding: "REVERSE",
    active: true,
    added_revision: "2",
    retired_revision: "0",
  },
  {
    id: "3",
    rule_id: "harassment",
    text: "Obsolete standard regarding single unrepeated tagging.",
    original_disposition: "REMOVED",
    holding: "REVERSE",
    active: false,
    added_revision: "1",
    retired_revision: "3",
  },
];

const MOCK_APPEAL: AppealRecord = {
  id: "1",
  primary: "0x2222222222222222222222222222222222222222",
  secondary: "0x1111111111111111111111111111111111111111",
  phase: "DONE",
  revision: "3",
  base: {
    rule_id: "harassment",
    original_disposition: "REMOVED",
    content: "Journalistic inquiry quoting public proceedings.",
    rationale: "Aligns with §2 precedent protecting investigative citations.",
  },
  outcome: "RESTORED",
  result: {
    v: 1,
    labels: ["DISTINGUISHABLE", "MATERIAL"],
  },
  domain: {
    snapshot_revision: "2",
    snapshot: [MOCK_PRECEDENTS[0], MOCK_PRECEDENTS[1]],
  },
};

describe("ProductIntro Component", () => {
  it("explains the anti-cherry-picking trust guarantee in the first viewport", () => {
    render(
      <ProductIntro
        registry={MOCK_REGISTRY}
        precedentsCount={2}
        appealsCount={1}
        isAuthority={false}
        userAddress="0x2222222222222222222222222222222222222222"
      />
    );

    expect(screen.getByText(/Anti-Cherry-Picking Guarantee/i)).toBeInTheDocument();
    expect(
      screen.getByText(/an appellant cannot cherry-pick favorable precedent/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/atomically freezes the complete active precedent set/i)
    ).toBeInTheDocument();
  });

  it("renders the 5 legible causal chain steps", () => {
    render(
      <ProductIntro
        registry={MOCK_REGISTRY}
        precedentsCount={2}
        appealsCount={1}
        isAuthority={false}
      />
    );

    expect(screen.getByText("Revisioned Registry")).toBeInTheDocument();
    expect(screen.getByText("Immutable Snapshot")).toBeInTheDocument();
    expect(screen.getByText("Consensus Labels")).toBeInTheDocument();
    expect(screen.getByText("Deterministic Holding")).toBeInTheDocument();
    expect(screen.getByText("Public Verification")).toBeInTheDocument();
  });
});

describe("Navigation Component", () => {
  it("renders brand mark, main workspaces links, and wallet button", () => {
    render(
      <Navigation
        view={{
          connected: false,
          chooserOpen: false,
          canWrite: false,
          action: "Connect wallet",
          badge: "Disconnected",
        }}
        chain={{
          id: 1234,
          chainIdHex: "0x4d2",
          name: "GenLayer Studionet",
          rpcUrl: "https://rpc.genlayer.com",
          nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
        }}
        contractAddress="0x1111111111111111111111111111111111111111"
        onWalletAction={vi.fn()}
        onToggleJournal={vi.fn()}
      />
    );

    expect(screen.getByText("Precedent Resolver")).toBeInTheDocument();
    expect(screen.getByText("Precedent Registry")).toBeInTheDocument();
    expect(screen.getByText("Appeals Casebook")).toBeInTheDocument();
    expect(screen.getByText("How It Works")).toBeInTheDocument();
    expect(screen.getByText("Connect wallet")).toBeInTheDocument();
    expect(screen.getByText("GenLayer Studionet")).toBeInTheDocument();
  });
});

describe("RegistryWorkspace Component", () => {
  it("renders precedent cards with fixed REMOVED origin and UPHOLD/REVERSE holdings", () => {
    render(
      <RegistryWorkspace
        registry={MOCK_REGISTRY}
        precedents={MOCK_PRECEDENTS}
        rule="harassment"
        onRuleChange={vi.fn()}
        isAuthority={false}
        canWrite={true}
        isRefreshing={false}
        onRefresh={vi.fn()}
        onAddPrecedent={vi.fn()}
        onRetirePrecedent={vi.fn()}
        configured={true}
      />
    );

    expect(screen.getByDisplayValue("harassment")).toBeInTheDocument();
    expect(screen.getByText("§ 1")).toBeInTheDocument();
    expect(screen.getByText("§ 2")).toBeInTheDocument();
    expect(screen.getAllByText("Original:")[0]).toBeInTheDocument();
    expect(screen.getAllByText("REMOVED")[0]).toBeInTheDocument();
    expect(screen.getByText("Maintain Removal")).toBeInTheDocument();
    expect(screen.getAllByText("Order Restoration")[0]).toBeInTheDocument();
  });

  it("renders authority workspace only when isAuthority is true", () => {
    const { rerender } = render(
      <RegistryWorkspace
        registry={MOCK_REGISTRY}
        precedents={MOCK_PRECEDENTS}
        rule="harassment"
        onRuleChange={vi.fn()}
        isAuthority={false}
        canWrite={true}
        isRefreshing={false}
        onRefresh={vi.fn()}
        onAddPrecedent={vi.fn()}
        onRetirePrecedent={vi.fn()}
        configured={true}
      />
    );

    expect(screen.getByText(/Public Observation Mode/i)).toBeInTheDocument();
    expect(screen.queryByText(/Add Normative Precedent/i)).not.toBeInTheDocument();

    rerender(
      <RegistryWorkspace
        registry={MOCK_REGISTRY}
        precedents={MOCK_PRECEDENTS}
        rule="harassment"
        onRuleChange={vi.fn()}
        isAuthority={true}
        canWrite={true}
        isRefreshing={false}
        onRefresh={vi.fn()}
        onAddPrecedent={vi.fn()}
        onRetirePrecedent={vi.fn()}
        configured={true}
      />
    );

    expect(screen.getByText(/Add Normative Precedent/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Public Precedent/i)).toBeInTheDocument();
  });
});

describe("AppealsWorkspace Component", () => {
  it("renders case dossiers with immutable snapshot seal and validator labels", () => {
    render(
      <AppealsWorkspace
        appeals={[MOCK_APPEAL]}
        rule="harassment"
        activePrecedents={[MOCK_PRECEDENTS[0], MOCK_PRECEDENTS[1]]}
        registry={MOCK_REGISTRY}
        userAddress="0x2222222222222222222222222222222222222222"
        canWrite={true}
        isAuthority={false}
        onCreateAppeal={vi.fn()}
        onReplaceAppeal={vi.fn()}
        onCaseAction={vi.fn()}
      />
    );

    expect(screen.getByText("Appeal Case #1")).toBeInTheDocument();
    expect(screen.getByText("RESTORED (Reversal Granted)")).toBeInTheDocument();
    expect(screen.getByText(/Immutable Precedent Snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/Registry Revision #2/i)).toBeInTheDocument();
    expect(screen.getByText("MATERIAL")).toBeInTheDocument();
    expect(screen.getByText("DISTINGUISHABLE")).toBeInTheDocument();
    expect(
      screen.getByText(/All 1 material precedent\(s\) held REVERSE; deterministic holding is RESTORED/i)
    ).toBeInTheDocument();
  });

  it("renders live precedent snapshot preview in file appeal card", () => {
    render(
      <AppealsWorkspace
        appeals={[MOCK_APPEAL]}
        rule="harassment"
        activePrecedents={[MOCK_PRECEDENTS[0], MOCK_PRECEDENTS[1]]}
        registry={MOCK_REGISTRY}
        userAddress="0x2222222222222222222222222222222222222222"
        canWrite={true}
        isAuthority={false}
        onCreateAppeal={vi.fn()}
        onReplaceAppeal={vi.fn()}
        onCaseAction={vi.fn()}
      />
    );

    expect(screen.getByText(/Live Precedent Snapshot Preview/i)).toBeInTheDocument();
    expect(
      screen.getByText(/2 active precedent\(s\) will be permanently frozen/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Create Appeal With Complete Active Snapshot/i)
    ).toBeInTheDocument();
  });
});

describe("TransactionHUD Component", () => {
  it("renders truthful status and hash for active and terminal phases", () => {
    const onDismiss = vi.fn();
    const { rerender } = render(
      <TransactionHUD
        phase="WAITING_FOR_FINALITY"
        hash="0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        explorerUrl="https://explorer.genlayer.com"
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText("Awaiting Consensus Finality")).toBeInTheDocument();
    expect(screen.getByText(/Validators are executing intelligent contract consensus/i)).toBeInTheDocument();
    expect(
      screen.getByText("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ).toBeInTheDocument();
    expect(screen.getByText("View on Explorer ↗")).toBeInTheDocument();

    rerender(
      <TransactionHUD
        phase="SUCCESS"
        hash="0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText("Transaction Confirmed & Verified")).toBeInTheDocument();
    expect(screen.getByText("Dismiss")).toBeInTheDocument();
  });
});

describe("WalletDialog Component", () => {
  it("renders only detected wallets or a helpful empty state when none are detected", () => {
    const dialogRef = createRef<HTMLDialogElement>();
    const onConnect = vi.fn();
    const onClose = vi.fn();

    const mockProvider: WalletProviderDetail = {
      walletId: "metamask",
      info: { uuid: "metamask-1", name: "MetaMask", icon: "/wallets/metamask.svg", rdns: "io.metamask" },
      provider: { request: vi.fn() },
    };

    const { rerender } = render(
      <WalletDialog
        dialogRef={dialogRef}
        providers={[mockProvider]}
        onConnect={onConnect}
        onClose={onClose}
      />
    );

    expect(screen.getByText("MetaMask")).toBeInTheDocument();
    expect(screen.getByText("io.metamask")).toBeInTheDocument();

    rerender(
      <WalletDialog
        dialogRef={dialogRef}
        providers={[]}
        onConnect={onConnect}
        onClose={onClose}
      />
    );

    expect(screen.getByText("No Supported Wallet Detected")).toBeInTheDocument();
    expect(screen.queryByText("MetaMask")).not.toBeInTheDocument();
    expect(screen.queryByText("OKX Wallet")).not.toBeInTheDocument();
    expect(screen.queryByText("Rabby Wallet")).not.toBeInTheDocument();
  });
});

describe("Documentation Component", () => {
  it("renders comprehensive public explanations without forbidden internal words", () => {
    const { container } = render(<Documentation />);

    expect(
      screen.getByText(/Purpose & Anti-Cherry-Picking Guarantee/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/GenLayer Intelligent Contract Consensus/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Deterministic Outcome Derivation Matrix/i)
    ).toBeInTheDocument();

    // Verify forbidden words do NOT appear anywhere in the documentation
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/codex/i);
    expect(text).not.toMatch(/claude/i);
    expect(text).not.toMatch(/checkpoint/i);
    expect(text).not.toMatch(/stage-1/i);
    expect(text).not.toMatch(/stage-2/i);
    expect(text).not.toMatch(/governance/i);
  });
});
