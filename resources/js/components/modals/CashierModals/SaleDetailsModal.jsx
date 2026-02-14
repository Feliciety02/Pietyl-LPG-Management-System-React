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
  return String(v).trim();
}

function toNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

export default function SaleDetailsModal({ open, onClose, sale }) {
  if (!sale) return null;

  const lines = Array.isArray(sale.lines) ? sale.lines : [];

  const treatmentLabel = treatmentLabels[sale.vat_treatment] || "VAT/Tax";
  const netAmount = toNumber(sale.net_amount);
  const vatAmount = toNumber(sale.vat_amount);
  const grossAmount = toNumber(sale.gross_amount || sale.grand_total);
  const subtotalAmount = toNumber(sale.subtotal);
  const discountAmount = toNumber(sale.discount);

  const showDiscount = discountAmount > 0;
  const showSubtotal = showDiscount && subtotalAmount > 0;

  const vatApplied = Boolean(sale.vat_applied);
  const rawRate = Number.isFinite(Number(sale.vat_rate)) ? Number(sale.vat_rate) * 100 : 0;
  const displayRate = vatApplied ? rawRate : 0;
  const rateLabel = `${displayRate.toFixed(2)}%`;

  const methodRaw = String(sale.method || "cash").toLowerCase();
  const method = methodRaw === "gcash" ? "GCash" : methodRaw === "card" ? "Card" : "Cash";

  const paymentRef = safeText(sale.payment_ref || sale.reference_no || "");
  const showPaymentRef = (methodRaw === "gcash" || methodRaw === "card") && paymentRef;

  const showCash =
    methodRaw === "cash" &&
    Number.isFinite(Number(sale.amount_received)) &&
    Number.isFinite(Number(sale.change));

  const dateLabel = safeText(sale.date_label) || safeText(sale.date) || "--";
  const timeLabel = safeText(sale.time_label) || safeText(sale.time);
  const dateTimeLabel = timeLabel ? `${dateLabel} ${timeLabel}` : dateLabel;

  const handlePrint = () => window.print();

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      layout="compact"
      title="Receipt"
      icon={FileText}
      headerRight={
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print
        </button>
      }
    >
      <div className="r-shell">
        <div className="r-wrap">
          <div className="r-card">
            <header className="r-head">
              <div className="r-brand">
                <img src={HeaderLogo} alt="Header Logo" className="r-logo" />
                <div className="r-brandtext">
                  <div className="r-name">PIEYTL LPG MARKETING</div>
                  <div className="r-meta">{safeText(sale.company_address) || "123 Main Street, Quezon City"}</div>
                  <div className="r-meta">Tel: {safeText(sale.company_phone) || "(02) 8123-4567"}</div>
                  <div className="r-meta">TIN: {safeText(sale.company_tin) || "123-456-789-000"}</div>
                </div>
              </div>

            </header>

            <div className="r-rule" />

            <section className="r-section">
              <div className="r-grid">
                <div className="r-row">
                  <div className="k">Receipt</div>
                  <div className="v">{safeText(sale.ref) || "—"}</div>
                </div>

                <div className="r-row">
                  <div className="k">Paid via</div>
                  <div className="v">{method}</div>
                </div>

                {showPaymentRef ? (
                  <div className="r-row">
                    <div className="k">Ref</div>
                    <div className="v">{paymentRef}</div>
                  </div>
                ) : null}

                <div className="r-row">
                  <div className="k">Date</div>
                  <div className="v">{dateTimeLabel}</div>
                </div>

              </div>
            </section>

            <div className="r-rule" />

            <section className="r-section">
              <table className="r-table">
                <thead>
                  <tr>
                    <th className="qty">Qty</th>
                    <th className="desc">Item</th>
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
                            <div className="item">{safeText(l.name) || "—"}</div>
                            {l.variant ? <div className="sub">{safeText(l.variant)}</div> : null}
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
            </section>

            <div className="r-rule" />

            <section className="r-section">
              <div className="r-totals">
                {showSubtotal ? (
                  <div className="trow">
                    <span className="k">Subtotal</span>
                    <span className="v">{formatCurrency(subtotalAmount)}</span>
                  </div>
                ) : null}

                {showDiscount ? (
                  <div className="trow">
                    <span className="k">Discount</span>
                    <span className="v">({formatCurrency(discountAmount)})</span>
                  </div>
                ) : null}

                {vatApplied ? (
                  <>
                    <div className="trow">
                      <span className="k">Net</span>
                      <span className="v">{formatCurrency(netAmount)}</span>
                    </div>
                    <div className="trow">
                      <span className="k">VAT {rateLabel}</span>
                      <span className="v">{formatCurrency(vatAmount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="note">VAT not applied.</div>
                )}

                <div className="r-rule subtle" />

                <div className="trow total">
                  <span className="k">Total</span>
                  <span className="v">{formatCurrency(grossAmount)}</span>
                </div>

                <div className="fine">
                  <div>{treatmentLabel}</div>
                  <div>{sale.vat_inclusive ? "Prices include VAT" : "Prices exclude VAT"}</div>
                </div>
              </div>
            </section>

            {showCash ? (
              <>
                <div className="r-rule" />
                <section className="r-section">
                  <div className="r-pay">
                    <div className="prow">
                      <span className="k">Received</span>
                      <span className="v">{formatCurrency(sale.amount_received)}</span>
                    </div>
                    <div className="prow strong">
                      <span className="k">Change</span>
                      <span className="v">{formatCurrency(sale.change)}</span>
                    </div>
                  </div>
                </section>
              </>
            ) : null}

            <div className="r-rule" />

            <footer className="r-foot">
              <div className="thanks">Thank you</div>
              <div className="help">Inquiries: {safeText(sale.company_phone) || "(02) 8123-4567"}</div>
            </footer>
          </div>
        </div>
      </div>

      <style>{`
        .r-shell{
          background: #ffffff;
          padding: 8px;
        }

        .r-wrap{
          max-height: 75vh;
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          padding: 8px 6px;
          scrollbar-width: none;
        }
        .r-wrap::-webkit-scrollbar{ width: 0; height: 0; }

        .r-card{
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid rgba(15,23,42,0.08);
          padding: 18px 18px;
        }

        .r-head{
          display:flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
          text-align: center;
        }

        .r-brand{
          width: 100%;
          display:flex;
          align-items: flex-start;
          gap: 8px;
          justify-content: center;
        }

        .r-logo{
          width: 42px;
          height: 42px;
          object-fit: contain;
          flex: 0 0 auto;
        }

        .r-brandtext{
          max-width: 520px;
          text-align: left;
        }

        .r-name{
          font-weight: 900;
          font-size: 13px;
          color: #0f172a;
        }

        .r-meta{
          margin-top: 2px;
          font-size: 11px;
          color: #64748b;
          line-height: 1.35;
        }

        .r-rule{
          margin: 10px 0;
          border-top: 1px solid rgba(148,163,184,0.35);
        }

        .r-rule.subtle{
          margin: 8px 0;
          border-top: 1px solid rgba(148,163,184,0.22);
        }

        .r-section{
          width: 100%;
        }

        .r-grid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 14px;
        }

        .r-row .k{
          font-size: 10px;
          color: #64748b;
          font-weight: 700;
        }

        .r-row .v{
          margin-top: 2px;
          font-size: 12px;
          color: #0f172a;
          font-weight: 900;
          word-break: break-word;
        }

        .r-table{
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .r-table thead th{
          text-align:left;
          padding: 8px 0;
          color: #64748b;
          font-weight: 900;
          border-bottom: 1px solid rgba(148,163,184,0.35);
        }

        .r-table td{
          padding: 8px 0;
          border-bottom: 1px solid rgba(148,163,184,0.22);
          vertical-align: top;
        }

        .r-table tbody tr:last-child td{
          border-bottom: none;
        }

        .r-table .qty{ width: 56px; }
        .r-table .price{ width: 110px; text-align:right; color:#0f172a; font-weight: 800; }
        .r-table .amt{ width: 120px; text-align:right; color:#0f172a; font-weight: 900; }

        .item{
          font-weight: 900;
          color: #0f172a;
          line-height: 1.25;
        }

        .sub{
          margin-top: 2px;
          font-size: 11px;
          color: #64748b;
        }

        .empty{
          padding: 12px 0;
          text-align:center;
          color:#64748b;
          font-weight: 800;
        }

        .r-totals .trow{
          display:flex;
          justify-content:space-between;
          padding: 4px 0;
        }

        .r-totals .k{
          color:#64748b;
          font-weight: 800;
          font-size: 12px;
        }

        .r-totals .v{
          color:#0f172a;
          font-weight: 900;
          font-size: 12px;
        }

        .r-totals .total .k,
        .r-totals .total .v{
          font-size: 14px;
        }

        .note{
          margin-top: 4px;
          font-size: 11px;
          color:#64748b;
          font-weight: 700;
        }

        .fine{
          margin-top: 8px;
          font-size: 11px;
          color:#64748b;
          font-weight: 700;
          line-height: 1.35;
        }

        .r-pay .prow{
          display:flex;
          justify-content:space-between;
          padding: 4px 0;
        }

        .r-pay .k{
          color:#64748b;
          font-weight: 800;
          font-size: 12px;
        }

        .r-pay .v{
          color:#0f172a;
          font-weight: 900;
          font-size: 12px;
        }

        .r-foot{
          text-align:center;
          color:#64748b;
          font-size: 12px;
        }

        .thanks{
          font-weight: 900;
          color:#0f172a;
        }

        .help{
          margin-top: 4px;
          font-weight: 700;
        }

        @media (max-width: 520px){
          .r-grid{
            grid-template-columns: 1fr;
          }
          .r-brand{
            justify-content: flex-start;
          }
          .r-head{
            align-items: flex-start;
            text-align: left;
          }
          .r-brandtext{
            text-align: left;
          }
        }

        @media print{
          .r-shell,
          .r-wrap,
          .r-card{
            background: #ffffff !important;
          }
          .r-card{
            border:none !important;
            margin: 0 !important;
            max-width: none !important;
            padding: 0 !important;
          }
          .r-wrap{
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </ModalShell>
  );
}
