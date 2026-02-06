// resources/js/Pages/CashierPage/POS.jsx
import React, { useEffect, useMemo, useState } from "react";
import { router, usePage, Link } from "@inertiajs/react";
import axios from "axios";
import Layout from "../Dashboard/Layout";
import AddCustomerModal from "@/components/modals/CustomerModals/AddCustomerModal";
import SaleDetailsModal from "@/components/modals/CashierModals/SaleDetailsModal";
import TransactionResultModal from "@/components/modals/TransactionResultModal";
import { posIcons, sidebarIconMap } from "@/components/ui/Icons";
import { calculateVat, VatTreatments, treatmentLabels } from "@/services/vatCalculator";

import { Info, PackageSearch, SlidersHorizontal, ShoppingCart, CreditCard, Users, Truck } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Card({ children, className = "" }) {
  return <div className={cx("rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm", className)}>{children}</div>;
}

function SectionTitle({ title, right, icon: Icon }) {
  return (
    <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 min-w-0">
        {Icon ? (
          <span className="inline-flex items-center justify-center h-9 w-9 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
            <Icon className="h-4 w-4 text-slate-600" />
          </span>
        ) : null}
        <div className="text-sm font-extrabold text-slate-800 truncate">{title}</div>
      </div>
      {right}
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition whitespace-nowrap",
        active ? "bg-teal-600 text-white ring-teal-600 teal-breathe" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function IconPill({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition whitespace-nowrap",
        active ? "bg-teal-600 text-white ring-teal-600 teal-breathe" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
      )}
    >
      <Icon className={cx("h-4 w-4", active ? "text-white" : "text-slate-600")} />
      {label}
    </button>
  );
}

function formatPeso(n) {
  const v = Number(n || 0);
  try {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(v);
  } catch {
    return `₱${v.toFixed(2)}`;
  }
}

function EmptyState({ title, desc, icon: Icon }) {
  return (
    <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-6 text-center">
      {Icon ? (
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white ring-1 ring-slate-200">
          <Icon className="h-6 w-6 text-slate-600" />
        </div>
      ) : null}
      <div className="mt-3 text-sm font-extrabold text-slate-800">{title}</div>
      <div className="mt-1 text-xs text-slate-600">{desc}</div>
    </div>
  );
}

const vatTreatmentOptions = Object.entries(treatmentLabels).map(([value, label]) => ({
  value,
  label,
}));

function PesoAmountInput({ value, onValueChange, disabled, placeholder = "0.00" }) {
  const sanitize = (raw) => {
    let s = String(raw ?? "");

    s = s.replace(/[^\d.]/g, "");

    const firstDot = s.indexOf(".");
    if (firstDot !== -1) {
      const before = s.slice(0, firstDot + 1);
      const after = s.slice(firstDot + 1).replace(/\./g, "");
      s = before + after;
    }

    if (s.length > 1 && s[0] === "0" && s[1] !== ".") {
      s = s.replace(/^0+/, "");
      if (s === "") s = "0";
    }

    return s;
  };

  const handleChange = (e) => {
    onValueChange(sanitize(e.target.value));
  };

  const handleKeyDown = (e) => {
    if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text");
    const clean = sanitize(text);
    e.preventDefault();
    onValueChange(clean);
  };

  return (
    <div
      className={cx(
        "mt-2 flex items-center rounded-2xl border border-slate-200 bg-white focus-within:ring-4 focus-within:ring-teal-500/15",
        disabled ? "opacity-80" : ""
      )}
    >
      <span className="pl-4 pr-2 text-sm font-extrabold text-slate-600 select-none">₱</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-2xl bg-transparent pr-4 py-2 text-sm font-extrabold text-slate-700 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

export default function POS() {
  const page = usePage();
  const user = page.props?.auth?.user;
  const roleKey = String(user?.role || "cashier");

  const isAdmin = roleKey === "admin";
  const readOnly = isAdmin || Boolean(page.props?.pos_read_only);

  const PosSearch = posIcons.search;
  const PosCash = posIcons.cashAlt || posIcons.cash;
  const PosGcash = posIcons.gcash;
  const PosCard = posIcons.card;

  const PosAdd = posIcons.add;
  const PosMinus = posIcons.minus;
  const PosRemove = posIcons.remove;
  const PosNext = posIcons.next;

  const PosLpg = posIcons.lpg;
  const PosStove = posIcons.stove;
  const PosAccessories = posIcons.accessories;

  const CustomersIcon = sidebarIconMap.customers;

  const products = Array.isArray(page.props?.products) ? page.props.products : [];
  const customers = Array.isArray(page.props?.customers) ? page.props.customers : [];

  const [resultModal, setResultModal] = useState({ open: false, status: "success", title: "", message: "" });
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState(null);

  const [delivery, setDelivery] = useState(false);
  const [payment, setPayment] = useState("cash");
  const [paymentRef, setPaymentRef] = useState("");
  const [customerId, setCustomerId] = useState(customers?.[0]?.id || null);
  const [q, setQ] = useState("");
  const [openAddCustomer, setOpenAddCustomer] = useState(false);

  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cashTendered, setCashTendered] = useState("");
  const vatSettings = page.props?.vat_settings || {};
  const vatRegistered = Boolean(vatSettings.vat_registered);
  const vatActive = Boolean(vatSettings.vat_active);
  const vatMode = vatSettings.vat_mode || "inclusive";
  const [vatTreatment, setVatTreatment] = useState(
    vatRegistered && vatActive ? VatTreatments.VATABLE : VatTreatments.EXEMPT
  );
  const [vatInclusive, setVatInclusive] = useState(vatMode === "inclusive");
  const [vatRate, setVatRate] = useState(vatRegistered ? Number(vatSettings.vat_rate ?? 0) : 0);

  useEffect(() => {
    setVatRate(vatRegistered ? Number(vatSettings.vat_rate ?? 0) : 0);
    setVatTreatment(vatRegistered && vatActive ? VatTreatments.VATABLE : VatTreatments.EXEMPT);
    setVatInclusive(vatMode === "inclusive");
  }, [vatRegistered, vatActive, vatSettings.vat_rate, vatMode]);

  const filteredProducts = useMemo(() => {
    const s = String(q || "").toLowerCase().trim();
    return products
      .filter((p) => {
        if (category === "all") return true;
        const raw = String(p.category || "").toLowerCase();
        const normalized = raw === "accesories" ? "accessories" : raw;
        return normalized === category;
      })
      .filter((p) => (!s ? true : `${p.name} ${p.variant}`.toLowerCase().includes(s)));
  }, [products, q, category]);

  const addToCart = (p) => {
    if (readOnly) return;

    const price = Number(p.price_swap || 0);
    const key = `${p.id}:swap`;

    setCart((prev) => {
      const idx = prev.findIndex((x) => x._key === key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { _key: key, product_id: p.id, name: p.name, variant: p.variant, mode: "swap", unit_price: price, qty: 1 }];
    });
  };

  const inc = (k) => {
    if (readOnly) return;
    setCart((prev) => prev.map((x) => (x._key === k ? { ...x, qty: x.qty + 1 } : x)));
  };

  const dec = (k) => {
    if (readOnly) return;
    setCart((prev) => prev.map((x) => (x._key === k ? { ...x, qty: Math.max(1, x.qty - 1) } : x)));
  };

  const remove = (k) => {
    if (readOnly) return;
    setCart((prev) => prev.filter((x) => x._key !== k));
  };

  const lineTotal = useMemo(() => cart.reduce((sum, x) => sum + Number(x.unit_price || 0) * Number(x.qty || 0), 0), [cart]);
  const shouldApplyVat = vatRegistered && vatActive;
  const effectiveVatRate = shouldApplyVat ? vatRate : 0;
  const effectiveVatInclusive = vatMode === "inclusive" ? true : vatInclusive;

  const vatResult = useMemo(() => {
    return calculateVat({
      amount: lineTotal,
      rate: effectiveVatRate,
      inclusive: effectiveVatInclusive,
      treatment: vatTreatment,
    });
  }, [lineTotal, effectiveVatRate, effectiveVatInclusive, vatTreatment]);

  const grossTotal = Math.max(0, vatResult.gross_amount);
  const netTotal = vatResult.net_amount;
  const vatTotal = vatResult.vat_amount;
  const displayVatRate = shouldApplyVat ? vatResult.rate_used : Number(vatSettings.vat_rate ?? 0);
  const displayedVatRate = vatTreatment === VatTreatments.VATABLE ? vatResult.rate_used : 0;
  const rateLabel = `${(displayVatRate * 100).toFixed(2)}%`;
  const appliedRateLabel = `${(displayedVatRate * 100).toFixed(2)}%`;

  const needsRef = payment === "gcash" || payment === "card";
  const validRef = !needsRef || String(paymentRef || "").trim().length >= 4;

  const tenderedNumber = useMemo(() => {
    const cleaned = String(cashTendered || "").trim();
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, n);
  }, [cashTendered]);

  const isCash = payment === "cash";
  const change = useMemo(
    () => (isCash ? Math.max(0, tenderedNumber - grossTotal) : 0),
    [isCash, tenderedNumber, grossTotal]
  );
  const cashEnough = !isCash || tenderedNumber >= grossTotal;

  const canCheckout = cart.length > 0 && !readOnly && validRef && !isSubmitting && cashEnough;

  const openSuccessModal = (message = "Sale was recorded successfully.") => {
    setResultModal({
      open: true,
      status: "success",
      title: "Payment complete",
      message,
    });
  };

  const handleReceiptClose = () => {
    setReceiptOpen(false);
    setReceiptSale(null);
    openSuccessModal();
  };

  const loadLatestSaleForReceipt = async () => {
    setReceiptSale(null);
    const { data } = await axios.get("/dashboard/cashier/sales/latest", {
      params: { per: 1, page: 1 },
    });
    const latest = Array.isArray(data?.data) ? data.data[0] ?? null : null;
    if (!latest) {
      throw new Error("Receipt data is not available yet.");
    }
    setReceiptSale(latest);
    setReceiptOpen(true);
  };

  const checkout = () => {
    if (!canCheckout) return;

    setIsSubmitting(true);

    router.post(
      "/dashboard/cashier/POS",
      {
        customer_id: customerId,
        is_delivery: delivery,
        payment_method: payment,
        payment_ref: needsRef ? String(paymentRef || "").trim() : null,

        cash_tendered: payment === "cash" ? tenderedNumber : null,
        vat_treatment: vatTreatment,
        vat_inclusive: vatInclusive,
        vat_rate: vatRate,

        lines: cart.map((x) => ({
          product_id: x.product_id,
          qty: x.qty,
          mode: "swap",
          unit_price: x.unit_price,
        })),
      },
      {
        preserveScroll: true,
        onSuccess: async () => {
          setCart([]);
          setQ("");
          setPaymentRef("");
          setCashTendered("");

          try {
            await loadLatestSaleForReceipt();
          } catch (error) {
            openSuccessModal(
              "Sale was recorded successfully. Receipt may take a moment to appear."
            );
          }
        },
        onError: (errs) => {
          const validationError =
            errs?.errors &&
            typeof errs.errors === "object" &&
            Object.values(errs.errors).find((value) => Array.isArray(value) && value.length);
          const validationMessage = Array.isArray(validationError) ? validationError[0] : null;
          const lockedMessage = errs?.errors?.locked?.[0];

          const msg =
            errs?.message ||
            lockedMessage ||
            validationMessage ||
            errs?.cash_tendered ||
            errs?.payment_ref ||
            errs?.customer_id ||
            (typeof errs === "object" ? "Please review the form and try again." : "Something went wrong.");

          setResultModal({ open: true, status: "error", title: "Payment failed", message: String(msg) });
        },
        onFinish: () => setIsSubmitting(false),
      }
    );
  };

  return (
    <Layout title="Point of Sale">
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card className="h-[calc(100vh-140px)] flex flex-col">
            <SectionTitle
              title="Product catalog"
              icon={PackageSearch}
              right={
                <div className="flex items-center gap-2">
                  <Pill active={category === "all"} onClick={() => setCategory("all")}>
                    All
                  </Pill>

                  <Pill active={category === "lpg"} onClick={() => setCategory("lpg")}>
                    <span className="inline-flex items-center gap-2">
                      <PosLpg className="h-4 w-4" />
                      LPG
                    </span>
                  </Pill>

                  <Pill active={category === "stove"} onClick={() => setCategory("stove")}>
                    <span className="inline-flex items-center gap-2">
                      <PosStove className="h-4 w-4" />
                      Stove
                    </span>
                  </Pill>

                  <Pill active={category === "accessories"} onClick={() => setCategory("accessories")}>
                    <span className="inline-flex items-center gap-2">
                      <PosAccessories className="h-4 w-4" />
                      Accessories
                    </span>
                  </Pill>
                </div>
              }
            />

            <div className="px-5 py-4 border-b border-slate-200">
              <div className="w-full flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
                <PosSearch className="h-4 w-4 text-slate-500 shrink-0" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search LPG, 11kg, regulator..."
                  className="w-full min-w-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="p-4 flex-1 min-h-0 overflow-y-auto no-scrollbar">
              {products.length === 0 ? (
                <EmptyState icon={PackageSearch} title="No products yet" desc="Ask admin to add products or check server props." />
              ) : filteredProducts.length === 0 ? (
                <EmptyState icon={PackageSearch} title="No matches" desc="Try changing the category or search keyword." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredProducts.map((p) => {
                    const price = Number(p.price_swap || 0);

                  

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addToCart(p)}
                        disabled={isNaN(price) || price <= 0 || readOnly || p.stock_qty <= 0}
                        className={cx(
                          "text-left rounded-3xl p-4 ring-1 transition hover:ring-teal-300/60 hover:shadow-[0_10px_22px_rgba(13,148,136,0.12)]",
                          readOnly ? "bg-slate-50 ring-slate-200 cursor-not-allowed" : "bg-white ring-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-slate-800 truncate">{p.name}</div>
                            <div className="mt-1 text-xs text-slate-500">{String(p.category || "").toUpperCase() || "—"}</div>
                            <div className="mt-1 text-xs text-slate-500">{"Stock: " + p.stock_qty}</div>
                          </div>

                          <div className="shrink-0 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 px-3 py-2 text-xs font-extrabold text-teal-900 teal-float">
                            {formatPeso(price)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="xl:col-span-5">
          <div className="h-[calc(100vh-140px)] overflow-y-auto no-scrollbar grid gap-6">
            <Card>
              <SectionTitle
                title="Sale setup"
                icon={SlidersHorizontal}
                right={
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill active={delivery} onClick={() => setDelivery((v) => !v)}>
                      <span className="inline-flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Delivery
                      </span>
                    </Pill>

                    {readOnly ? (
                      <span className="rounded-2xl bg-amber-600/10 text-amber-900 ring-1 ring-amber-700/10 px-3 py-2 text-xs font-extrabold">
                        ADMIN VIEW ONLY
                      </span>
                    ) : null}
                  </div>
                }
              />

              <div className="p-5 grid gap-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                  <Users className="h-4 w-4 text-slate-500" />
                  Customer
                </div>

                <div className="flex gap-2">
                  <select
                    value={customerId || ""}
                    onChange={(e) => setCustomerId(Number(e.target.value))}
                    className="w-full rounded-2xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/20"
                    disabled={readOnly}
                  >
                    {customers.length === 0 ? (
                      <option value="">No customers</option>
                    ) : (
                      customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `• ${c.phone}` : ""}
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={() => setOpenAddCustomer(true)}
                    className={cx(
                      "shrink-0 inline-flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-extrabold ring-1 transition",
                      readOnly ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                    )}
                    disabled={readOnly}
                    title="Add customer"
                  >
                    <CustomersIcon className={cx("h-4 w-4", readOnly ? "text-slate-400" : "text-slate-600")} />
                    Add
                  </button>
                </div>

                {isAdmin ? (
                  <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2 text-xs text-slate-600">
                    Admin view only mode. To test cashier actions, log in as cashier.
                  </div>
                ) : null}
              </div>
            </Card>

            <Card>
              <SectionTitle title="Cart" icon={ShoppingCart} right={<div className="text-xs text-slate-500">{cart.length} items</div>} />

              <div className="p-5 grid gap-3">
                {cart.length === 0 ? (
                  <EmptyState icon={ShoppingCart} title="Cart is empty" desc="Add products from the catalog." />
                ) : (
                  cart.map((x) => (
                    <div key={x._key} className="rounded-3xl bg-white ring-1 ring-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-slate-800 truncate">{x.name}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(x._key)}
                          disabled={readOnly}
                          className={cx(
                            "rounded-2xl p-2 ring-1 transition",
                            readOnly ? "bg-slate-100 ring-slate-200 text-slate-400 cursor-not-allowed" : "bg-white ring-slate-200 hover:bg-slate-50"
                          )}
                          title="Remove"
                        >
                          <PosRemove className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => dec(x._key)}
                            disabled={readOnly}
                            className={cx(
                              "rounded-2xl p-2 ring-1 transition",
                              readOnly ? "bg-slate-100 ring-slate-200 text-slate-400 cursor-not-allowed" : "bg-white ring-slate-200 hover:bg-slate-50"
                            )}
                            aria-label="Decrease quantity"
                          >
                            <PosMinus className="h-4 w-4" />
                          </button>

                          <div className="min-w-[44px] text-center text-sm font-extrabold text-slate-800">{x.qty}</div>

                          <button
                            type="button"
                            onClick={() => inc(x._key)}
                            disabled={readOnly}
                            className={cx(
                              "rounded-2xl p-2 ring-1 transition",
                              readOnly ? "bg-slate-100 ring-slate-200 text-slate-400 cursor-not-allowed" : "bg-white ring-slate-200 hover:bg-slate-50"
                            )}
                            aria-label="Increase quantity"
                          >
                            <PosAdd className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-sm font-extrabold text-slate-800">{formatPeso(Number(x.unit_price) * Number(x.qty))}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <SectionTitle title="Payment" icon={CreditCard} right={<div className="text-xs text-slate-500">Select method</div>} />

              <div className="p-5 grid gap-4">
                <div className="flex flex-wrap gap-2">
                  <IconPill
                    active={payment === "cash"}
                    onClick={() => {
                      setPayment("cash");
                      setPaymentRef("");
                    }}
                    icon={PosCash}
                    label="Cash"
                  />
                  <IconPill
                    active={payment === "gcash"}
                    onClick={() => {
                      setPayment("gcash");
                      setCashTendered("");
                    }}
                    icon={PosGcash}
                    label="GCash"
                  />
                  <IconPill
                    active={payment === "card"}
                    onClick={() => {
                      setPayment("card");
                      setCashTendered("");
                    }}
                    icon={PosCard}
                    label="Card"
                  />
                </div>

                {needsRef ? (
                  <div>
                    <label className="text-xs font-extrabold text-slate-700">
                      {payment === "gcash" ? "GCash reference number" : "Card reference number"}
                    </label>
                    <input
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                      placeholder={payment === "gcash" ? "Enter GCash reference" : "Enter card reference"}
                      disabled={readOnly}
                    />
                    <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
                      <Info className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div className="leading-relaxed">Required so this payment can be verified later if needed.</div>
                    </div>
                  </div>
                ) : null}

                {payment === "cash" ? (
                  <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-5">
                    <div className="text-xs font-extrabold text-slate-700">Amount received</div>

                    <PesoAmountInput value={cashTendered} onValueChange={setCashTendered} disabled={readOnly} placeholder="0.00" />

                    <div className="mt-3 grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-semibold">Amount due</span>
                        <span className="text-slate-800 font-extrabold">{formatPeso(grossTotal)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-semibold">Received</span>
                        <span className="text-slate-800 font-extrabold">{formatPeso(tenderedNumber)}</span>
                      </div>

                      <div className="h-px bg-slate-200" />

                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 text-sm font-extrabold">Change</span>
                        <span className="text-slate-800 text-lg font-extrabold">{formatPeso(change)}</span>
                      </div>
                    </div>

                    {!cashEnough ? (
                      <div className="mt-2 flex items-start gap-2 text-xs text-rose-600">
                        <Info className="mt-0.5 h-4 w-4 text-rose-500" />
                        <div className="leading-relaxed">Amount received must be equal to or higher than the total.</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {vatRegistered ? (
                  <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">VAT options</div>
                        <p className="text-xs text-slate-500">Select treatment and pricing mode</p>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">Rate: {rateLabel}</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-500">VAT treatment</label>
                        <select
                          value={vatTreatment}
                          onChange={(event) => setVatTreatment(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
                        >
                          {vatTreatmentOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-500">Pricing</label>
                        {vatMode === "inclusive" ? (
                          <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                            VAT-inclusive pricing enforced by admin.
                          </div>
                        ) : (
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setVatInclusive(true)}
                              className={cx(
                                "flex-1 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1",
                                vatInclusive
                                  ? "bg-teal-600 text-white ring-teal-600"
                                  : "bg-white text-slate-700 ring-slate-200"
                              )}
                            >
                              Inclusive
                            </button>
                            <button
                              type="button"
                              onClick={() => setVatInclusive(false)}
                              className={cx(
                                "flex-1 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1",
                                !vatInclusive
                                  ? "bg-teal-600 text-white ring-teal-600"
                                  : "bg-white text-slate-700 ring-slate-200"
                              )}
                            >
                              Exclusive
                            </button>
                          </div>
                        )}
                        <p className="mt-1 text-[11px] text-slate-500">
                          {effectiveVatInclusive
                            ? "Entered prices include VAT."
                            : "Entered prices are VAT-exclusive."}
                        </p>
                      </div>
                    </div>
                    {!vatActive && vatSettings.vat_effective_date ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                        VAT activates on {vatSettings.vat_effective_date}.
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-5 space-y-2">
                    <div className="text-sm font-extrabold text-slate-900">VAT registration is off</div>
                    <div className="text-xs text-slate-500">
                      VAT calculations stay hidden until the company enables VAT registration via settings.
                    </div>
                    {vatSettings.vat_effective_date ? (
                      <div className="text-xs text-slate-500">
                        VAT will become active on {vatSettings.vat_effective_date}.
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-semibold">Line total</span>
                    <span className="text-slate-800 font-extrabold">{formatPeso(lineTotal)}</span>
                  </div>

                  <div className="border-t border-slate-200" />

                  <div className="space-y-1">
                    {shouldApplyVat ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 text-sm">Net</span>
                          <span className="text-slate-800 font-extrabold">{formatPeso(netTotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 text-sm">VAT ({appliedRateLabel})</span>
                          <span className="text-slate-800 font-extrabold">{formatPeso(vatTotal)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-500">
                        {vatRegistered
                          ? vatActive
                            ? "VAT is currently 0% for this transaction."
                            : `VAT will apply on ${vatSettings.vat_effective_date || "the effective date"}.`
                          : "VAT is disabled for this company."}
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-slate-200" />

                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 text-sm font-extrabold">Gross</span>
                    <span className="text-slate-800 text-lg font-extrabold">{formatPeso(grossTotal)}</span>
                  </div>

                  <div className="text-xs text-slate-500">
                    <div>{treatmentLabels[vatTreatment]}</div>
                    <div>{effectiveVatInclusive ? "Prices include VAT" : "Prices exclude VAT"}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={checkout}
                  disabled={!canCheckout}
                  className={cx(
                    "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25 hover:-translate-y-0.5",
                    canCheckout ? "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700 teal-breathe" : "bg-slate-200 text-slate-500 ring-slate-200 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? "Processing..." : "Confirm payment"}
                  <PosNext className="h-4 w-4" />
                </button>

                <div className="text-xs text-slate-500">
                  {readOnly ? (
                    <span>
                      Admin can view this page but cannot finalize sales.{" "}
                      <Link href="/dashboard/admin" className="text-teal-700 font-semibold hover:text-teal-800">
                        Back to dashboard
                      </Link>
                    </span>
                  ) : needsRef && !validRef ? (
                    <span>Please enter a valid reference number to continue.</span>
                  ) : payment === "cash" && !cashEnough ? (
                    <span>Please enter amount received that covers the total.</span>
                  ) : (
                    <span>Payment is recorded first, delivery is dispatched after.</span>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <AddCustomerModal
        open={openAddCustomer}
        onClose={() => setOpenAddCustomer(false)}
        postTo="/dashboard/cashier/customers"
        onCreated={(created) => {
          if (created?.id) setCustomerId(created.id);
        }}
      />

      <SaleDetailsModal open={receiptOpen} onClose={handleReceiptClose} sale={receiptSale} />

      <TransactionResultModal
        open={resultModal.open}
        status={resultModal.status}
        title={resultModal.title}
        message={resultModal.message}
        onClose={() => setResultModal((s) => ({ ...s, open: false }))}
        primaryLabel={resultModal.status === "error" ? "Try again" : "Close"}
        onPrimary={() => setResultModal((s) => ({ ...s, open: false }))}
        secondaryLabel={resultModal.status === "error" ? "Close" : undefined}
        onSecondary={resultModal.status === "error" ? () => setResultModal((s) => ({ ...s, open: false })) : undefined}
      />
    </Layout>
  );
}
