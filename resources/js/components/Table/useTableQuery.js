
import { router, usePage } from "@inertiajs/react";
import { useMemo } from "react";

function normalize(u = "") {
  return String(u).split("?")[0];
}

function toNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function useTableQuery({ endpoint, meta = null, defaults = {} }) {
  const page = usePage();
  const url = normalize(page?.url || endpoint || "");

  const initialFilters = page.props?.filters || {};

  const query = useMemo(() => {
    return {
      q: initialFilters?.q ?? defaults.q ?? "",
      risk: initialFilters?.risk ?? defaults.risk ?? "all",
      req: initialFilters?.req ?? defaults.req ?? "all",
      per: toNum(initialFilters?.per ?? defaults.per, 10),
      page: toNum(initialFilters?.page ?? defaults.page, 1),
    };
  }, [
    initialFilters,
    defaults.q,
    defaults.risk,
    defaults.req,
    defaults.per,
    defaults.page,
  ]);

  const push = (patch = {}) => {
    const next = { ...query, ...patch };

    router.get(endpoint || url, next, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const set = (key, value, opts = {}) => {
    const resetPage = Boolean(opts.resetPage);
    push({ [key]: value, ...(resetPage ? { page: 1 } : {}) });
  };

  const setPer = (n) => push({ per: toNum(n, query.per), page: 1 });

  const canPrev = !!meta && (meta.current_page || 1) > 1;
  const canNext = !!meta && (meta.current_page || 1) < (meta.last_page || 1);

  const prevPage = () => {
    if (!canPrev) return;
    push({ page: (meta.current_page || 1) - 1 });
  };

  const nextPage = () => {
    if (!canNext) return;
    push({ page: (meta.current_page || 1) + 1 });
  };

  return {
    query,
    push,
    set,
    setPer,
    prevPage,
    nextPage,
    canPrev,
    canNext,
  };
}