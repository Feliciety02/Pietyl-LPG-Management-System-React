// resources/js/Pages/CashierPage/POS.jsx
import React, { useMemo, useState } from "react";
import { router, usePage, Link } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import AddCustomerModal from "@/components/modals/CustomerModals/AddCustomerModal";
import { posIcons, sidebarIconMap } from "@/components/ui/Icons";
import TransactionResultModal from "@/components/modals/TransactionResultModal";

import {
  Info,
  PackageSearch,
  SlidersHorizontal,
  ShoppingCart,
  CreditCard,
  Users,
  Truck,
} from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Card({ children, className = "" }) {
  return (
    <div className={cx("rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm", className)}>
      {children}
    </div>
  );
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
        active
          ? "bg-teal-600 text-white ring-teal-600"
          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
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
        active
          ? "bg-teal-600 text-white ring-teal-600"
          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
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

export default function POS() {
  const page = usePage();
  const user = page.props?.auth?.user;
  const roleKey = String(user?.role || "cashier");

  const isAdmin = roleKey === "admin";
  const readOnly = isAdmin || Boolean(page.props?.pos_read_only);

  const PosCart = posIcons.cart;
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

  const [resultModal, setResultModal] = useState({
    open: false,
    status: "success",
    title: "",
    message: "",
  });

  const [delivery, setDelivery] = useState(false);
  const [payment, setPayment] = useState("cash");
  const [paymentRef, setPaymentRef] = useState("");
  const [customerId, setCustomerId] = useState(customers?.[0]?.id || null);
  const [q, setQ] = useState("");
  const [openAddCustomer, setOpenAddCustomer] = useState(false);

  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      return [
        ...prev,
        { _key: key, product_id: p.id, name: p.name, variant: p.variant, mode: "swap", unit_price: price, qty: 1 },
      ];
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

  const subtotal = useMemo(() => {
    return cart.reduce((sum, x) => sum + Number(x.unit_price || 0) * Number(x.qty || 0), 0);
  }, [cart]);

  const total = Math.max(0, subtotal);

  const needsRef = payment === "gcash" || payment === "card";
  const validRef = !needsRef || String(paymentRef || "").trim().length >= 4;

  const canCheckout = cart.length > 0 && !readOnly && validRef && !isSubmitting;

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
        lines: cart.map((x) => ({
          product_id: x.product_id,
          qty: x.qty,
          mode: "swap",
          unit_price: x.unit_price,
        })),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setCart([]);
          setQ("");
          setPaymentRef("");

          setResultModal({
            open: true,
            status: "success",
            title: "Payment complete",
            message: "Sale was recorded successfully.",
          });
        },
        onError: (errs) => {
          const msg =
            errs?.message ||
            errs?.payment_ref ||
            errs?.customer_id ||
            (typeof errs === "object" ? "Please review the form and try again." : "Something went wrong.");

          setResultModal({
            open: true,
            status: "error",
            title: "Payment failed",
            message: String(msg),
          });
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

              <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
                <Info className="mt-0.5 h-4 w-4 text-slate-400" />
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
                        disabled={readOnly}
                        className={cx(
                          "text-left rounded-3xl p-4 ring-1 transition",
                          readOnly
                            ? "bg-slate-50 ring-slate-200 cursor-not-allowed"
                            : "bg-white ring-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-slate-800 truncate">
                              {p.name} <span className="text-slate-500 font-semibold">({p.variant})</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {String(p.category || "").toUpperCase() || "—"}
                            </div>
                          </div>

                          <div className="shrink-0 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 px-3 py-2 text-xs font-extrabold text-teal-900">
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
                      readOnly
                        ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
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
                          <div className="text-sm font-extrabold text-slate-800 truncate">
                            {x.name} <span className="text-slate-500 font-semibold">({x.variant})</span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">SWAP • {formatPeso(x.unit_price)} each</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(x._key)}
                          disabled={readOnly}
                          className={cx(
                            "rounded-2xl p-2 ring-1 transition",
                            readOnly
                              ? "bg-slate-100 ring-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-white ring-slate-200 hover:bg-slate-50"
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
                              readOnly
                                ? "bg-slate-100 ring-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-white ring-slate-200 hover:bg-slate-50"
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
                              readOnly
                                ? "bg-slate-100 ring-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-white ring-slate-200 hover:bg-slate-50"
                            )}
                            aria-label="Increase quantity"
                          >
                            <PosAdd className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-sm font-extrabold text-slate-800">
                          {formatPeso(Number(x.unit_price) * Number(x.qty))}
                        </div>
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
                  <IconPill active={payment === "gcash"} onClick={() => setPayment("gcash")} icon={PosGcash} label="GCash" />
                  <IconPill active={payment === "card"} onClick={() => setPayment("card")} icon={PosCard} label="Card" />
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

                <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-semibold">Subtotal</span>
                    <span className="text-slate-800 font-extrabold">{formatPeso(subtotal)}</span>
                  </div>

                  <div className="mt-3 h-px bg-slate-200" />

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-slate-700 text-sm font-extrabold">Total</span>
                    <span className="text-slate-800 text-lg font-extrabold">{formatPeso(total)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={checkout}
                  disabled={!canCheckout}
                  className={cx(
                    "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25",
                    canCheckout
                      ? "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700"
                      : "bg-slate-200 text-slate-500 ring-slate-200 cursor-not-allowed"
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
          router.reload({ only: ["customers"] });
        }}
      />

      <TransactionResultModal
        open={resultModal.open}
        status={resultModal.status}
        title={resultModal.title}
        message={resultModal.message}
        onClose={() => setResultModal((s) => ({ ...s, open: false }))}
        primaryLabel={resultModal.status === "error" ? "Try again" : "Close"}
        onPrimary={() => setResultModal((s) => ({ ...s, open: false }))}
        secondaryLabel={resultModal.status === "error" ? "Close" : undefined}
        onSecondary={
          resultModal.status === "error"
            ? () => setResultModal((s) => ({ ...s, open: false }))
            : undefined
        }
      />
    </Layout>
  );
}
