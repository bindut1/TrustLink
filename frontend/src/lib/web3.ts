/**
 * MetaMask / wallet helpers for non-custodial issuer signing (Blockcerts-style).
 * The issuer's private key never leaves the wallet — we only request signatures
 * and transactions.
 *
 * We talk to MetaMask via raw EIP-1193 (`window.ethereum.request`) instead of
 * ethers' BrowserProvider: the provider's error coalescing breaks against the
 * public Polygon Amoy RPC ("could not coalesce error"). ethers is used only for
 * pure ABI encoding.
 */
import { Interface, type Eip1193Provider } from "ethers";
import type { CredentialTypedData } from "./eip712";

declare global {
  interface Window {
    ethereum?: Eip1193Provider & { on?: (...args: unknown[]) => void };
  }
}

const REGISTRY_IFACE = new Interface([
  "function issueBatch(bytes32 _merkleRoot)",
]);

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_POLYGON_CHAIN_ID ?? "80002");
const CHAIN_ID_HEX = "0x" + CHAIN_ID.toString(16); // 80002 -> 0x13882
const ISSUE_BATCH_GAS = "0x" + (150000).toString(16); // ~90k needed, safe ceiling
// Amoy enforces a minimum priority fee of 25 gwei; MetaMask often under-quotes
// it, so we set EIP-1559 fees explicitly.
const MAX_PRIORITY_FEE = "0x" + (30 * 1e9).toString(16); // 30 gwei tip
const MAX_FEE = "0x" + (150 * 1e9).toString(16); // 150 gwei ceiling

export class WalletError extends Error {}

function eth(): Eip1193Provider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new WalletError(
      "MetaMask not found. Please install it to issue credentials.",
    );
  }
  return window.ethereum;
}

/** Ensure the wallet's ACTIVE network is Amoy (switch / add if needed). */
async function ensureChain(): Promise<void> {
  const provider = eth();
  const current = (await provider.request({ method: "eth_chainId" })) as string;
  if (parseInt(current, 16) === CHAIN_ID) return;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (err) {
    if ((err as { code?: number }).code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_ID_HEX,
            chainName: "Polygon Amoy",
            nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
            rpcUrls: ["https://rpc-amoy.polygon.technology"],
            blockExplorerUrls: ["https://amoy.polygonscan.com"],
          },
        ],
      });
    } else {
      throw new WalletError(
        `Please switch your wallet network to Polygon Amoy (chain ${CHAIN_ID}).`,
      );
    }
  }
}

/** Prompt connection and return the selected address (lowercased). */
export async function connectWallet(): Promise<string> {
  const accounts = (await eth().request({
    method: "eth_requestAccounts",
  })) as string[];
  if (!accounts?.length) throw new WalletError("No wallet account selected.");
  return accounts[0].toLowerCase();
}

/** The wallet's currently selected account (may differ from the one connected). */
export async function getActiveAccount(): Promise<string> {
  const accounts = (await eth().request({ method: "eth_accounts" })) as string[];
  if (!accounts?.length) throw new WalletError("Wallet not connected.");
  return accounts[0].toLowerCase();
}

/** Sign one credential's EIP-712 typed data (EthereumEip712Signature2021). */
export async function signCredentialTypedData(
  typedData: CredentialTypedData,
): Promise<string> {
  await ensureChain();
  const from = await getActiveAccount();
  const payload = JSON.stringify({
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
      ],
      Credential: typedData.types.Credential,
    },
    domain: typedData.domain,
    primaryType: "Credential",
    message: typedData.message,
  });
  return (await eth().request({
    method: "eth_signTypedData_v4",
    params: [from, payload],
  })) as string;
}

/** Broadcast `issueBatch(root)` from the issuer's own wallet; returns tx hash. */
export async function anchorBatchOnChain(merkleRoot: string): Promise<string> {
  if (!CONTRACT_ADDRESS) {
    throw new WalletError("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.");
  }
  await ensureChain();
  const from = await getActiveAccount();
  const data = REGISTRY_IFACE.encodeFunctionData("issueBatch", [merkleRoot]);

  const txHash = (await eth().request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: CONTRACT_ADDRESS,
        data,
        gas: ISSUE_BATCH_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE,
        maxFeePerGas: MAX_FEE,
      },
    ],
  })) as string;

  // Poll for the receipt ourselves (raw RPC) — robust against the flaky public RPC.
  for (let i = 0; i < 60; i++) {
    const receipt = (await eth().request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    })) as { status?: string } | null;
    if (receipt) {
      if (receipt.status === "0x1") return txHash;
      throw new WalletError("Giao dịch anchor bị revert on-chain.");
    }
    await new Promise((res) => setTimeout(res, 2000));
  }
  throw new WalletError("Hết thời gian chờ giao dịch anchor được xác nhận.");
}
