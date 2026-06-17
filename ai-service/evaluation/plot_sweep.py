"""Render Figure 3.38 — verified-weight trade-off curve — from report/sweep.json.

Shows that raising the verified weight improves ranking and cuts trust risk, but
trades off recall (genuinely-relevant yet-unverified candidates drop out). The
learned weight is marked from backend/config/match-weights.json (not hard-coded).

Usage:  python plot_sweep.py   # writes report/sweep.png
"""
import json
import os

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(HERE, "report", "sweep.json")))

# Learned verified weight (for the marker) — read it, don't hard-code.
wpath = os.path.join(HERE, "..", "..", "backend", "config", "match-weights.json")
learned_v = 0.0
if os.path.exists(wpath):
    learned_v = float(json.load(open(wpath)).get("verified", 0.0))

v = [r["verified"] for r in data]
ndcg = [r["ndcg_at_5"] for r in data]
prec = [r["precision_at_5"] for r in data]
recall = [r.get("recall_at_10", 0.0) for r in data]
claimed = [r["claimed_only_rate_at_5"] for r in data]

fig, ax = plt.subplots(figsize=(7, 4.3))
ax.plot(v, ndcg, "o-", color="#1f77b4", label="NDCG@5 (chất lượng xếp hạng)")
ax.plot(v, prec, "s--", color="#2ca02c", label="Precision@5")
ax.plot(v, recall, "D-.", color="#9467bd", label="Recall@10 (đánh đổi)")
ax.plot(v, claimed, "^-", color="#d62728", label="claimed-only@5 (rủi ro tin cậy)")

if learned_v > 0:
    ax.axvline(learned_v, color="gray", ls=":", lw=1.5)
    ax.annotate(
        f"trọng số học được\n{learned_v:.3f}".replace(".", ","),
        xy=(learned_v, 0.45),
        xytext=(min(learned_v + 0.04, 0.6), 0.30),
        fontsize=9,
        color="gray",
        arrowprops=dict(arrowstyle="->", color="gray"),
    )

ax.set_xlabel("Trọng số tầng verified (v)")
ax.set_ylabel("Giá trị chỉ số")
ax.set_title("Đánh đổi theo trọng số tầng xác thực")
ax.set_ylim(0.0, 1.05)
ax.grid(True, alpha=0.3)
ax.legend(loc="lower center", fontsize=8, framealpha=0.9, ncol=2)
fig.tight_layout()

out = os.path.join(HERE, "report", "sweep.png")
fig.savefig(out, dpi=200)
print(f"Wrote {out}")
