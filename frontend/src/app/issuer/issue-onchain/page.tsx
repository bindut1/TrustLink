"use client";

import { ShieldCheck, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { CandidateLookup } from "@/components/issuer/CandidateLookup";
import { DynamicForm } from "@/components/issuer/DynamicForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { ApiError } from "@/lib/api";
import {
  anchorBatch,
  disconnectIssuerWallet,
  fetchCredentialTypes,
  fetchMyInstitution,
  prepareBatch,
  registerIssuerWallet,
} from "@/lib/issuer-api";
import {
  WalletError,
  anchorBatchOnChain,
  connectWallet,
  getActiveAccount,
  signCredentialTypedData,
} from "@/lib/web3";
import type {
  CandidateLookupResult,
  CredentialType,
  IssueCredentialPayload,
} from "@/types/issuer";

type FieldValue = string | number | string[] | undefined;

/**
 * Non-custodial issuance: the issuer signs each VC (EIP-712) and broadcasts the
 * Merkle-batch anchor with their OWN MetaMask wallet. TrustLink never holds the
 * issuer key — it only prepares the batch and verifies the signatures.
 */
export default function IssueOnChainPage() {
  useSetPageMeta(
    "Cấp văn bằng",
    "Issuer tự ký và tự anchor lên blockchain — TrustLink không giữ khoá.",
  );

  const [types, setTypes] = useState<CredentialType[] | null>(null);
  const [typeId, setTypeId] = useState("");
  const [credentialNumber, setCredentialNumber] = useState("");
  const [title, setTitle] = useState("");
  const [issuedDate, setIssuedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [expiryDate, setExpiryDate] = useState("");
  const [candidate, setCandidate] = useState<CandidateLookupResult | null>(null);
  const [metadata, setMetadata] = useState<Record<string, FieldValue>>({});

  const [wallet, setWallet] = useState<string | null>(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);
  const [hasMetaMask, setHasMetaMask] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [doneTx, setDoneTx] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchCredentialTypes().then(setTypes);
    setHasMetaMask(Boolean(window.ethereum));
  }, []);
  // Restore the REGISTERED issuer wallet on reload (the truth, not whatever
  // account MetaMask happens to be on). To change it, the issuer clicks connect.
  useEffect(() => {
    fetchMyInstitution()
      .then((inst) => {
        if (inst.signingAddress) setWallet(inst.signingAddress);
      })
      .catch(() => {
        /* no institution / not registered — leave null */
      })
      .finally(() => setWalletLoading(false));
  }, []);
  useEffect(() => {
    setMetadata({});
  }, [typeId]);

  const selectedType = types?.find((t) => t.id === typeId) ?? null;

  async function connect() {
    setWalletBusy(true);
    setError(null);
    try {
      const address = await connectWallet();
      const res = await registerIssuerWallet(address);
      setWallet(address);
      if (!res.authorized) {
        setError(
          "Ví đã đăng ký nhưng CHƯA được uỷ quyền on-chain (addIssuer). Quản trị viên cần uỷ quyền địa chỉ này, nếu không giao dịch anchor sẽ bị từ chối.",
        );
      }
    } catch (e) {
      setError(
        e instanceof WalletError || e instanceof ApiError
          ? e.message
          : "Không kết nối được ví.",
      );
    } finally {
      setWalletBusy(false);
    }
  }

  async function disconnect() {
    setWalletBusy(true);
    setError(null);
    try {
      await disconnectIssuerWallet();
      setWallet(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không ngắt kết nối được.");
    } finally {
      setWalletBusy(false);
    }
  }

  async function issue() {
    if (!wallet) return setError("Hãy kết nối ví MetaMask trước.");
    if (!candidate) return setError("Hãy chọn ứng viên nhận.");
    if (!selectedType) return setError("Hãy chọn loại văn bằng.");

    // Guard: the active MetaMask account must match the connected/registered
    // issuer wallet — otherwise the tx would be sent from an unauthorized
    // account and revert ("Not authorized issuer" / signer mismatch).
    let active: string;
    try {
      active = await getActiveAccount();
    } catch (e) {
      return setError(
        e instanceof WalletError ? e.message : "Không đọc được ví MetaMask.",
      );
    }
    if (active !== wallet) {
      return setError(
        `Ví đang chọn trong MetaMask (${active.slice(0, 6)}…${active.slice(-4)}) khác ví đã kết nối. Hãy chuyển MetaMask về đúng ví đã kết nối, hoặc bấm "Kết nối MetaMask" để đăng ký ví hiện tại.`,
      );
    }

    setBusy(true);
    setError(null);
    setDoneTx(null);
    const payload: IssueCredentialPayload = {
      credentialNumber: credentialNumber.trim(),
      credentialTypeId: selectedType.id,
      candidateId: candidate.id,
      title: title.trim(),
      issuedDate,
      expiryDate: expiryDate || undefined,
      metadata: metadata as Record<string, unknown>,
    };

    try {
      // 1. Backend builds credentials + Merkle tree, returns typed data to sign.
      setStatus("Đang chuẩn bị lô (tính Merkle root)…");
      const prepared = await prepareBatch([payload]);

      // 2. Issuer signs each VC with MetaMask (key never leaves the wallet).
      setStatus("Ký từng văn bằng trong ví MetaMask…");
      const signatures = [];
      for (const item of prepared.items) {
        const signature = await signCredentialTypedData(item.typedData);
        signatures.push({ credentialId: item.credentialId, signature });
      }

      // 3. Issuer broadcasts the batch anchor from their own wallet.
      setStatus("Gửi giao dịch anchor lên blockchain (ký trong ví)…");
      const txHash = await anchorBatchOnChain(prepared.merkleRoot);

      // 4. Backend verifies signatures + on-chain root, then issues.
      setStatus("Xác minh chữ ký và lưu văn bằng…");
      await anchorBatch({
        merkleRoot: prepared.merkleRoot,
        txHash,
        signatures,
      });

      setDoneTx(txHash);
      setStatus(null);
      setCredentialNumber("");
      setTitle("");
      setExpiryDate("");
      setMetadata({});
      setCandidate(null);
    } catch (e) {
      setStatus(null);
      const err = e as {
        shortMessage?: string;
        reason?: string;
        info?: { error?: { message?: string } };
        message?: string;
      };
      const detail =
        e instanceof WalletError || e instanceof ApiError
          ? e.message
          : err?.reason ??
            err?.shortMessage ??
            err?.info?.error?.message ??
            err?.message ??
            "Phát hành thất bại. Vui lòng thử lại.";
      setError(`Phát hành thất bại: ${detail}`);
    } finally {
      setBusy(false);
    }
  }

  const typeOptions = [
    { value: "", label: "— Chọn loại văn bằng —" },
    ...(types ?? [])
      .filter((ct) => ct.isActive)
      .map((ct) => ({
        value: ct.id,
        label: ct.nameEn ? `${ct.name} · ${ct.nameEn}` : ct.name,
      })),
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void issue();
      }}
      className="flex flex-col gap-5"
    >
      {doneTx && (
        <Alert variant="success">
          Đã cấp & anchor lên blockchain.{" "}
          <a
            href={`https://amoy.polygonscan.com/tx/${doneTx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline-offset-2 hover:underline"
          >
            Xem giao dịch
          </a>
        </Alert>
      )}
      {status && <Alert variant="info">{status}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <Section step="00" title="Ví issuer (MetaMask)" subtitle="Khoá ký nằm trong ví của bạn, TrustLink không giữ.">
        {walletLoading ? (
          <p className="text-[13px] text-fg-subtle">Đang kiểm tra ví…</p>
        ) : wallet ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[13px] text-fg">
              Đã kết nối:{" "}
              <span className="font-mono text-[12.5px]">{wallet}</span>
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void disconnect()}
              loading={walletBusy}
            >
              Ngắt kết nối
            </Button>
          </div>
        ) : hasMetaMask === false ? (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] text-fg-muted">
              Chưa phát hiện ví MetaMask trong trình duyệt. Hãy cài tiện ích
              MetaMask để kết nối ví và ký cấp văn bằng on-chain.
            </p>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 rounded-ctl bg-navy px-4 py-2 text-[13px] font-medium text-white hover:bg-navy/90 transition-colors"
            >
              <Wallet size={15} /> Cài đặt MetaMask →
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => void connect()}
              loading={walletBusy}
              leftIcon={<Wallet size={16} />}
            >
              Kết nối MetaMask
            </Button>
            <p className="text-[12px] text-fg-faint">
              Chưa có ví?{" "}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal hover:underline"
              >
                Cài đặt MetaMask
              </a>
            </p>
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <Section step="01" title="Loại văn bằng">
          {!types ? (
            <div className="text-fg-subtle text-[14px]">Đang tải…</div>
          ) : (
            <FormField label="Loại văn bằng" required>
              <SelectMenu
                value={typeId}
                onChange={setTypeId}
                options={typeOptions}
                ariaLabel="Loại văn bằng"
              />
            </FormField>
          )}
        </Section>
        <Section step="02" title="Ứng viên nhận">
          <CandidateLookup value={candidate} onChange={setCandidate} />
        </Section>
      </div>

      {selectedType && (
        <Section step="03" title="Chi tiết văn bằng">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <FormField label="Số văn bằng" required>
              <Input
                value={credentialNumber}
                onChange={(e) => setCredentialNumber(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Tên văn bằng" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Ngày cấp" required>
              <Input
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Ngày hết hạn">
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </FormField>
          </div>

          {selectedType.fieldSchema?.fields?.length > 0 && (
            <DynamicForm
              schema={selectedType.fieldSchema}
              value={metadata}
              onChange={setMetadata}
              errors={{}}
            />
          )}
        </Section>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="submit"
          variant="verified"
          size="lg"
          loading={busy}
          disabled={!wallet || !candidate || !selectedType}
          leftIcon={<ShieldCheck size={16} />}
        >
          Ký & cấp on-chain
        </Button>
      </div>
    </form>
  );
}

function Section({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-canvas p-5 sm:p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.10em] text-navy">
          {step}
        </span>
        <div>
          <h2 className="text-[16px] font-semibold tracking-[-0.015em] text-fg leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[12.5px] text-fg-subtle mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
