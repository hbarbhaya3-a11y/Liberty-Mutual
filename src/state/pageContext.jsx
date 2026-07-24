import { createContext, useContext, useEffect, useState } from "react";

/* Lightweight page-context channel. Pages publish what they are (an id like
   "ifwhat-results") + optional `facts` (the live data on screen); Ask TwinX
   reads it to show contextual presets and answer contextually. */
const PageCtx = createContext(null);

export function PageContextProvider({ children }) {
  const [page, setPage] = useState({ id: null, facts: null });
  return <PageCtx.Provider value={{ page, setPage }}>{children}</PageCtx.Provider>;
}

export function usePageContext() {
  return useContext(PageCtx) || { page: { id: null, facts: null }, setPage: () => {} };
}

/* Call from a page/view to publish its context. Re-publishes whenever id or the
   facts identity changes; resets to null on unmount. */
export function useSetPageContext(id, facts) {
  const { setPage } = usePageContext();
  useEffect(() => {
    setPage({ id, facts });
    return () => setPage({ id: null, facts: null });
  }, [id, facts, setPage]);
}
