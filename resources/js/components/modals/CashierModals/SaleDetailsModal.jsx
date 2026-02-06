import React from "react";
import ModalShell from "../ModalShell";
import { FileText, Printer } from "lucide-react";
import HeaderLogo from "../../../../images/Header_Logo.png";
import { treatmentLabels } from "@/services/vatCalculator";

function formatCurrency(amount) {
  const v = Number(amount || 0);
  return `₱${v.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function safeText(v) {
  if (v == null) return "";
  const s = String(v).trim();
  return s;
}

function toNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

export default function SaleDetailsModal({ open, onClose, sale }) {
  if (!sale) return null;

  const lines = Array.isArray(sale.lines) ? sale.lines : [];

  const treatmentLabel =
    treatmentLabels[sale.vat_treatment] || "VAT/Tax";
  const netAmount = toNumber(sale.net_amount);
  const vatAmount = toNumber(sale.vat_amount);
  const grossAmount = toNumber(sale.gross_amount || sale.grand_total);
  const vatApplied = Boolean(sale.vat_applied);
  const rawRate = Number.isFinite(Number(sale.vat_rate)) ? Number(sale.vat_rate) * 100 : 0;
  const displayRate = vatApplied ? rawRate : 0;
  const rateLabel = `${displayRate.toFixed(2)}%`;

  const methodRaw = String(sale.method || "cash").toLowerCase();
  const method =
    methodRaw === "gcash" ? "GCash" : methodRaw === "card" ? "Card" : "Cash";

  const showCash =
    methodRaw === "cash" &&
    Number.isFinite(Number(sale.amount_received)) &&
    Number.isFinite(Number(sale.change));

  const handlePrint = () => window.print();

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      layout="compact"
      title="Transaction Complete"
      subtitle="Sales receipt"
      icon={FileText}
      headerRight={
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print
        </button>
      }
    >
      <div className="receipt-shell font-arial">
        <div className="receipt-scroll">
          <div className="receipt-card">
            <div className="receipt-head">
              <img src={HeaderLogo} alt="Header Logo" className="receipt-logo-img" />

              <div className="receipt-company">
                <div className="receipt-company-name">PIEYTL LPG MARKETING</div>
                <div className="receipt-company-meta">
                  {safeText(sale.company_address) || "123 Main Street, Quezon City"}
                </div>
                <div className="receipt-company-meta">
                  Tel: {safeText(sale.company_phone) || "(02) 8123-4567"}
                </div>
                <div className="receipt-company-meta">
                  TIN: {safeText(sale.company_tin) || "123-456-789-000"}
                </div>
              </div>
            </div>

            <div className="receipt-divider" />

            <div className="receipt-title">
              <span className="receipt-title-text">SALES RECEIPT</span>
            </div>

            <div className="receipt-divider" />

            <div className="receipt-meta">
              <div className="receipt-meta-row">
                <span className="k">Receipt No:</span>
                <span className="v strong">{safeText(sale.ref) || "—"}</span>
              </div>
              <div className="receipt-meta-row">
                <span className="k">Date:</span>
                <span className="v">
                  {safeText(sale.date_label) || safeText(sale.date) || "—"}
                </span>
              </div>
              <div className="receipt-meta-row">
                <span className="k">Time:</span>
                <span className="v">
                  {safeText(sale.time_label) || safeText(sale.time) || "—"}
                </span>
              </div>
            </div>

            <div className="receipt-table-wrap">
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th className="qty">Qty</th>
                    <th className="desc">Description</th>
                    <th className="price">Price</th>
                    <th className="amt">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length ? (
                    lines.map((l, i) => {
                      const qty = Number(l.qty || 0);
                      const unit = Number(l.unit_price || 0);
                      const lineTotal = unit * qty;

                      return (
                        <tr key={i}>
                          <td className="qty">{qty}</td>
                          <td className="desc">
                            <div className="desc-name">{safeText(l.name) || "—"}</div>
                            {l.variant ? (
                              <div className="desc-sub">{safeText(l.variant)}</div>
                            ) : null}
                          </td>
                          <td className="price">{formatCurrency(unit)}</td>
                          <td className="amt">{formatCurrency(lineTotal)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="empty" colSpan={4}>
                        No items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="receipt-totals">
            {vatApplied ? (
              <>
                <div className="trow">
                  <span className="k">Net</span>
                  <span className="v">{formatCurrency(netAmount)}</span>
                </div>
                <div className="trow">
                  <span className="k">VAT ({rateLabel})</span>
                  <span className="v">{formatCurrency(vatAmount)}</span>
                </div>
                <div className="receipt-divider soft" />
              </>
            ) : (
              <div className="text-xs font-semibold text-slate-500">
                VAT is not applied for this transaction.
              </div>
            )}

              <div className="trow total">
                <span className="k">Gross</span>
                <span className="v">{formatCurrency(grossAmount)}</span>
              </div>

              <div className="mt-2 text-[11px] font-semibold text-slate-500">
                <div>{treatmentLabel}</div>
                <div>{sale.vat_inclusive ? "Prices include VAT" : "Prices exclude VAT"}</div>
              </div>
            </div>

            <div className="receipt-payment">
              <div className="prow">
                <span className="k">Payment Method:</span>
                <span className="v strong">{method}</span>
              </div>

              {showCash ? (
                <>
                  <div className="prow">
                    <span className="k">Amount Received:</span>
                    <span className="v">{formatCurrency(sale.amount_received)}</span>
                  </div>
                  <div className="prow">
                    <span className="k strong">Change:</span>
                    <span className="v strong">{formatCurrency(sale.change)}</span>
                  </div>
                </>
              ) : null}
            </div>

            <div className="receipt-divider" />

            <div className="receipt-footer">
              <div className="thanks">Thank you for your purchase!</div>
              <div className="help">
                For inquiries, please call {safeText(sale.company_phone) || "(02) 8123-4567"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .font-arial,
        .font-arial * {
          font-family: Arial, Helvetica, sans-serif;
        }

        /* FORCE EVERYTHING TO WHITE ONLY */
        .receipt-shell{
          background: #ffffff !important;
          border-radius: 14px;
          padding: 12px;
        }

        .receipt-scroll{
          max-height: 75vh;
          overflow-y: auto;
          padding: 10px;
          -webkit-overflow-scrolling: touch;
          background: #ffffff !important;
          scrollbar-width: none;
        }
        .receipt-scroll::-webkit-scrollbar {
          width: 0;
          background: transparent;
        }

        .receipt-card{
          width: 100%;
          max-width: 820px;
          margin: 0 auto;
          background: #ffffff !important;
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.10);
          box-shadow: 0 10px 30px rgba(15,23,42,0.10);
          padding: 34px 34px;
        }

        .receipt-head{
          display:flex;
          flex-direction: column;
          align-items:center;
          gap:10px;
        }

        .receipt-logo-img{
          width: 62px;
          height: 62px;
          object-fit: contain;
        }

        .receipt-company{
          text-align:center;
        }

        .receipt-company-name{
          font-weight: 700;
          font-size: 26px;
          color:#111827;
        }

        .receipt-company-meta{
          font-size: 13px;
          color:#6b7280;
          margin-top: 2px;
        }

        .receipt-divider{
          margin: 18px 0;
          border-top: 1px dashed rgba(148,163,184,0.65);
        }

        .receipt-divider.soft{
          margin: 14px 0;
          border-top: 1px dashed rgba(148,163,184,0.55);
        }

        .receipt-title{
          text-align:center;
          padding: 6px 0;
        }

        .receipt-title-text{
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.12em;
        }

        .receipt-meta{
          font-size: 14px;
          color:#374151;
        }

        .receipt-meta-row{
          display:flex;
          justify-content:space-between;
          padding: 6px 0;
        }

        .receipt-meta-row .k{
          color:#6b7280;
        }

        .receipt-meta-row .v{
          font-weight: 700;
          color:#111827;
        }

        .receipt-table-wrap{
          margin-top: 16px;
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 8px;
          overflow:hidden;
          background: #ffffff !important;
        }

        .receipt-table{
          width:100%;
          border-collapse: collapse;
          font-size: 14px;
          background: #ffffff !important;
        }

        .receipt-table thead th{
          background: #e5e7eb;
          padding: 12px 14px;
          font-weight: 700;
          text-align:left;
        }

        .receipt-table td{
          padding: 14px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff !important;
        }

        .receipt-table tbody tr:last-child td{
          border-bottom: none;
        }

        .receipt-table .qty{ width: 70px; }
        .receipt-table .price{ width: 140px; text-align:right; }
        .receipt-table .amt{ width: 150px; text-align:right; font-weight: 700; }

        .receipt-totals{
          margin-top: 18px;
          font-size: 16px;
          background: #ffffff !important;
        }

        .receipt-totals .trow{
          display:flex;
          justify-content:space-between;
          padding: 6px 0;
        }

        .receipt-totals .total{
          font-size: 22px;
          font-weight: 700;
        }

        .receipt-payment{
          margin-top: 16px;
          padding: 16px;
          border-radius: 10px;
          background: #ffffff !important;
          border: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .receipt-footer{
          margin-top: 12px;
          text-align:center;
          font-size: 14px;
          color:#6b7280;
          background: #ffffff !important;
        }

        @media print{
          .receipt-shell,
          .receipt-scroll,
          .receipt-card{
            background: #ffffff !important;
          }
          .receipt-card{
            box-shadow:none !important;
            border:none !important;
            margin: 0 !important;
            max-width: none !important;
          }
          .receipt-scroll{
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </ModalShell>
  );
}
