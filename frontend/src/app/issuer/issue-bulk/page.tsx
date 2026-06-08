"use client";

import { ShieldCheck, Upload, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { ApiError } from "@/lib/api";
import {
  anchorBatchBulk,
  fetchCredentialTypes,
  lookupCandidate,
  prepareBatch,
} from "@/lib/issuer-api";
import {
  disconnectIssuerWallet,
  fetchMyInstitution,
  registerIssuerWallet,
} from "@/lib/issuer-api";
import {
  WalletError,
  anchorBatchOnChain,
  connectWallet,
  getActiveAccount,
  signBatchTypedData,
} from "@/lib/web3";
import type { CredentialType, IssueCredentialPayload } from "@/types/issuer";

type Row = Record<string, unknown>;

const BASE_COLS = ["candidateEmail", "credentialNumber", "title", "issuedDate"];

function cell(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return v == null ? "" : String(v).trim();
}

/**
 * Non-custodial BULK issuance: parse an Excel of N credentials, build one Merkle
 * batch, the issuer signs the root ONCE (MetaMask) and broadcasts a single
 * issueBatch tx. TrustLink never holds the issuer key.
 */
export default function IssueBulkPage() {
  useSetPageMeta(
    "Cấp hàng loạt",
    "Upload Excel → 1 chữ ký + 1 giao dịch cho cả lô. Non-custodial.",
  );

  const [types, setTypes] = useState<CredentialType[] | null>(null);
  const [typeId, setTypeId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [wallet, setWallet] = useState<string | null>(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);
  const [hasMetaMask, setHasMetaMask] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ tx: string; count: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchCredentialTypes().then(setTypes);
    setHasMetaMask(Boolean(window.ethereum));
  }, []);
  // Restore the REGISTERED issuer wallet on reload (not the active MM account).
  useEffect(() => {
    fetchMyInstitution()
      .then((inst) => {
        if (inst.signingAddress) setWallet(inst.signingAddress);
      })
      .catch(() => {
        /* not registered */
      })
      .finally(() => setWalletLoading(false));
  }, []);

  const selectedType = types?.find((t) => t.id === typeId) ?? null;
  const metaKeys = selectedType?.fieldSchema?.fields?.map((f) => f.key) ?? [];
  const expectedCols = [...BASE_COLS, "expiryDate (tuỳ chọn)", ...metaKeys];

  async function connect() {
    setWalletBusy(true);
    setError(null);
    try {
      const address = await connectWallet();
      const res = await registerIssuerWallet(address);
      setWallet(address);
      if (!res.authorized) {
        setError(
          "Ví đã đăng ký nhưng CHƯA được uỷ quyền on-chain. Quản trị viên cần uỷ quyền địa chỉ này.",
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

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setDone(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
      setRows(parsed);
      setFileName(`${file.name} (${parsed.length} dòng)`);
    } catch {
      setError("Không đọc được file Excel. Hãy kiểm tra định dạng.");
    }
  }

  async function issue() {
    if (!wallet) return setError("Hãy kết nối ví MetaMask trước.");
    if (!selectedType) return setError("Hãy chọn loại văn bằng.");
    if (rows.length === 0) return setError("Hãy upload file Excel có dữ liệu.");

    let active: string;
    try {
      active = await getActiveAccount();
    } catch (e) {
      return setError(e instanceof WalletError ? e.message : "Không đọc được ví.");
    }
    if (active !== wallet) {
      return setError(
        `Ví đang chọn (${active.slice(0, 6)}…${active.slice(-4)}) khác ví đã kết nối. Hãy chuyển MetaMask về đúng ví, hoặc kết nối lại.`,
      );
    }

    setBusy(true);
    setError(null);
    setDone(null);
    try {
      // 1. Resolve each row → credential item (email → candidateId, metadata).
      setStatus("Đang phân giải ứng viên + dựng dữ liệu…");
      const items: IssueCredentialPayload[] = [];
      for (const [i, row] of rows.entries()) {
        const email = cell(row.candidateEmail);
        if (!email) throw new Error(`Dòng ${i + 2}: thiếu candidateEmail`);
        let candidateId: string;
        try {
          candidateId = (await lookupCandidate(email)).id;
        } catch {
          throw new Error(`Dòng ${i + 2}: không tìm thấy ứng viên ${email}`);
        }
        const metadata: Record<string, unknown> = {};
        for (const f of selectedType.fieldSchema?.fields ?? []) {
          const raw = cell(row[f.key]);
          if (f.type === "skills") {
            // catalog tokens, comma/semicolon separated; backend validates them
            metadata[f.key] = raw
              .split(/[,;]/)
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean);
          } else {
            metadata[f.key] =
              f.type === "number" && raw !== "" ? Number(raw) : raw;
          }
        }
        items.push({
          credentialNumber: cell(row.credentialNumber),
          credentialTypeId: selectedType.id,
          candidateId,
          title: cell(row.title),
          issuedDate: cell(row.issuedDate),
          expiryDate: cell(row.expiryDate) || undefined,
          metadata,
        });
      }

      // 2. Backend builds ONE Merkle tree + returns the batch typed data to sign.
      setStatus(`Dựng Merkle cho ${items.length} văn bằng…`);
      const prepared = await prepareBatch(items);

      // 3. Issuer signs the batch root ONCE.
      setStatus("Ký lô (1 chữ ký trong MetaMask)…");
      const batchSignature = await signBatchTypedData(prepared.batchTypedData);

      // 4. One issueBatch tx anchors the whole batch.
      setStatus("Gửi 1 giao dịch anchor lên blockchain…");
      const txHash = await anchorBatchOnChain(prepared.merkleRoot);

      // 5. Backend verifies the single signature + on-chain root, then issues all.
      setStatus("Xác minh + lưu văn bằng…");
      const res = await anchorBatchBulk({
        merkleRoot: prepared.merkleRoot,
        txHash,
        batchSignature,
        issuedAt: prepared.batchTypedData.message.issuedAt,
      });

      setDone({ tx: txHash, count: res.anchored });
      setStatus(null);
      setRows([]);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setStatus(null);
      const err = e as {
        shortMessage?: string;
        reason?: string;
        message?: string;
      };
      setError(
        e instanceof WalletError || e instanceof ApiError
          ? e.message
          : (err?.reason ?? err?.shortMessage ?? err?.message ?? "Cấp hàng loạt thất bại."),
      );
    } finally {
      setBusy(false);
    }
  }

  const typeOptions = [
    { value: "", label: "— Chọn loại văn bằng —" },
    ...(types ?? [])
      .filter((ct) => ct.isActive)
      .map((ct) => ({ value: ct.id, label: ct.nameEn ? `${ct.name} · ${ct.nameEn}` : ct.name })),
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void issue();
      }}
      className="flex flex-col gap-5"
    >
      {done && (
        <Alert variant="success">
          Đã cấp & anchor <b>{done.count}</b> văn bằng bằng <b>1 giao dịch</b>.{" "}
          <a
            href={`https://amoy.polygonscan.com/tx/${done.tx}`}
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
              Đã kết nối: <span className="font-mono text-[12.5px]">{wallet}</span>
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={() => void disconnect()} loading={walletBusy}>
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
            <Button type="button" variant="primary" onClick={() => void connect()} loading={walletBusy} leftIcon={<Wallet size={16} />}>
              Kết nối MetaMask
            </Button>
            <p className="text-[12px] text-fg-faint">
              Chưa có ví?{" "}
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
                Cài đặt MetaMask
              </a>
            </p>
          </div>
        )}
      </Section>

      <Section step="01" title="Loại văn bằng (chung cho cả lô)">
        {!types ? (
          <div className="text-fg-subtle text-[14px]">Đang tải…</div>
        ) : (
          <FormField label="Loại văn bằng" required>
            <SelectMenu value={typeId} onChange={setTypeId} options={typeOptions} ariaLabel="Loại văn bằng" />
          </FormField>
        )}
      </Section>

      {selectedType && (
        <Section
          step="02"
          title="Upload Excel"
          subtitle={`Cột yêu cầu: ${expectedCols.join(", ")}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFile}
            className="block text-[13px] file:mr-3 file:rounded-ctl file:border-0 file:bg-navy/10 file:px-3 file:py-2 file:text-navy"
          />
          {fileName && (
            <p className="mt-3 inline-flex items-center gap-2 text-[13px] text-fg">
              <Upload size={14} /> {fileName}
            </p>
          )}
        </Section>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="submit"
          variant="verified"
          size="lg"
          loading={busy}
          disabled={!wallet || !selectedType || rows.length === 0}
          leftIcon={<ShieldCheck size={16} />}
        >
          Ký & cấp hàng loạt on-chain ({rows.length})
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
