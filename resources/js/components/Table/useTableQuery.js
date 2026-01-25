
import { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";

function normalize(u = "") {
  return String(u || "").split("?")[0];
}

/*
  useTableQuery
  Purpose
  Keep all server side table query logic in one place.

  Reads initial filters from: usePage().props.filters
  Uses current path from: usePage().url

  You pass:
  endpoint (optional) if you want to override the current page url
  defaults: default values for your filters
  meta: paginator meta (current_page, last_page) for prev/next helpers

  Returns:
  query: current query object
  set: setters for fields
  push: push query to server
  paging helpers: setPer, setPage, nextPage, prevPage
*/

export default function useTableQuery({
  meta = null,
  endpoint = null,
  defaults = {},
  preserveScroll = true,
  preserveState = true,
  replace = true,
} = {}) {
  const page = usePage();

  const initialFilters = page.props?.filters || {};
  const currentUrl = normalize(page?.url || "");
  const target = endpoint || currentUrl || "/";

  const initial = useMemo(() => {
    return {
      ...defaults,
      ...initialFilters,
    };
  }, []);

  const [query, setQuery] = useState(initial);

  useEffect(() => {
    setQuery((prev) => {
      const merged = { ...defaults, ...initialFilters };
      const same = JSON.stringify(prev) === JSON.stringify(merged);
      return same ? prev : merged;
    });
  }, [page.props?.filters]);

  const push = (patch = {}) => {
    const next = { ...query, ...patch };

    router.get(target, next, {
      preserveScroll,
      preserveState,
      replace,
    });

    setQuery(next);
  };

  const set = (key, value, options = {}) => {
    const patch = { [key]: value };

    if (options.resetPage) patch.page = 1;

    setQuery((prev) => ({ ...prev, ...patch }));

    if (options.push !== false) {
      push(patch);
    }
  };

  const setPer = (n) => {
    push({ per: Number(n) || 10, page: 1 });
  };

  const setPage = (n) => {
    const nextPage = Math.max(Number(n) || 1, 1);
    push({ page: nextPage });
  };

  const nextPage = () => {
    if (!meta) return;
    const current = Number(meta.current_page || 1);
    const last = Number(meta.last_page || 1);
    if (current >= last) return;
    push({ page: current + 1 });
  };

  const prevPage = () => {
    if (!meta) return;
    const current = Number(meta.current_page || 1);
    if (current <= 1) return;
    push({ page: current - 1 });
  };

  const canPrev = Boolean(meta && Number(meta.current_page || 1) > 1);
  const canNext = Boolean(meta && Number(meta.current_page || 1) < Number(meta.last_page || 1));

  return {
    query,
    setQuery,

    push,
    set,

    setPer,
    setPage,
    nextPage,
    prevPage,

    canPrev,
    canNext,

    endpoint: target,
  };
}
