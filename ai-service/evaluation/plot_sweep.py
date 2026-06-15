"""Render Figure 3.38 — verified-weight trade-off curve — from report/sweep.json.

Usage:  python plot_sweep.py   # writes report/sweep.png
"""
import json
import os

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(HERE, "report", "sweep.json")))

v = [r["verified"] for r in data]
ndcg = [r["ndcg_at_5"] for r in data]
prec = [r["precision_at_5"] for r in data]
claimed = [r["claimed_only_rate_at_5"] for r in data]

fig, ax = plt.subplots(figsize=(7, 4.3))
ax.plot(v, ndcg, "o-", color="#1f77b4", label="NDCG@5 (chất lượng xếp hạng)")
ax.plot(v, prec, "s--", color="#2ca02c", label="Precision@5")
ax.plot(v, claimed, "^-", color="#d62728", label="claimed-only@5 (rủi ro tin cậy)")

ax.axvline(0.4793, color="gray", ls=":", lw=1.5)
ax.annotate(
    "trọng số học được\n0,479",
    xy=(0.4793, 0.50),
    xytext=(0.52, 0.40),
    fontsize=9,
    color="gray",
    arrowprops=dict(arrowstyle="->", color="gray"),
)

ax.set_xlabel("Trọng số tầng verified (v)")
ax.set_ylabel("Giá trị chỉ số")
ax.set_title("Đánh đổi theo trọng số tầng xác thực")
ax.set_ylim(0.0, 1.05)
ax.grid(True, alpha=0.3)
ax.legend(loc="lower center", fontsize=9, framealpha=0.9)
fig.tight_layout()

out = os.path.join(HERE, "report", "sweep.png")
fig.savefig(out, dpi=200)
print(f"Wrote {out}")
