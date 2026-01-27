import { router, usePage } from "@inertiajs/react";
import { useMemo } from "react";

function normalize(u = "") {
  return String(u).split("?")[0];
}

function parseQuery(url = "") {
  const s = String(url || "");
  const qs = s.includes("?") ? s.split("?")[1] : "";
  const params = new URLSearchParams(qs);

  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

function toNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function useTableQuery({ endpoint, meta = null, defaults = {} }) {
  const page = usePage();

  const url = normalize(page?.url || endpoint || "");
  const urlQuery = useMemo(() => parseQuery(page?.url || ""), [page?.url]);

  const propFilters = page.props?.filters || {};

  const getVal = (key, fallback = "") => {
    const v = propFilters?.[key] ?? urlQuery?.[key] ?? fallback;
    return v == null ? fallback : v;
  };

  const query = useMemo(() => {
    return {
      q: getVal("q", defaults.q ?? ""),
      risk: getVal("risk", defaults.risk ?? "all"),
      req: getVal("req", defaults.req ?? "all"),

      per: toNum(getVal("per", defaults.per ?? 10), defaults.per ?? 10),
      page: toNum(getVal("page", defaults.page ?? 1), defaults.page ?? 1),

      sort: getVal("sort", defaults.sort ?? ""),
      dir: getVal("dir", defaults.dir ?? "asc"),
    };
  }, [
    urlQuery,
    propFilters,
    defaults.q,
    defaults.risk,
    defaults.req,
    defaults.per,
    defaults.page,
    defaults.sort,
    defaults.dir,
  ]);

  const push = (patch = {}) => {
    const next = { ...query, ...patch };

    Object.keys(next).forEach((k) => {
      if (next[k] === "" || next[k] == null) delete next[k];
    });

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
