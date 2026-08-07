"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * ── What the page is about ────────────────────────────────────────────────
 *
 * The assistant is reachable from every route, which is only useful if it
 * knows where you are. Without that, "when does it land?" on a transfer page
 * has to be answered "which transfer?" — and having to name the record you are
 * already looking at is exactly the friction a docked assistant exists to
 * remove.
 *
 * So each page declares a one-line descriptor of itself, and the assistant
 * scopes its answers to that. A page that declares nothing gets the whole
 * book, which is the old behaviour.
 *
 * Deliberately tiny: a label, and the id of the record in view if there is
 * one. Anything richer would tempt pages into shipping their whole state
 * through here, and the store is already the place for that.
 */

export interface PageScope {
  /** Shown to the user as the assistant's current subject. */
  label: string;
  /** The transfer this page is about, if any. Scopes the answers. */
  orderId?: string;
  /** Openers worth offering here, in the user's voice. */
  suggestions?: string[];
}

interface PageScopeApi {
  scope: PageScope | null;
  setScope: (scope: PageScope | null) => void;
}

const Ctx = createContext<PageScopeApi>({ scope: null, setScope: () => {} });

export function PageScopeProvider({ children }: { children: React.ReactNode }) {
  const [scope, setScope] = useState<PageScope | null>(null);
  const value = useMemo(() => ({ scope, setScope }), [scope]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Read the current page's scope. Used by the assistant. */
export function usePageScope(): PageScope | null {
  return useContext(Ctx).scope;
}

/**
 * Declare what this page is about. Clears itself on unmount, so navigating
 * away cannot leave the assistant talking about the page you just left.
 *
 * Pass a stable object or memoise it — this deliberately re-registers whenever
 * the descriptor changes so a page can update it as its own state moves.
 */
export function useDeclarePageScope(scope: PageScope | null) {
  const { setScope } = useContext(Ctx);

  const label = scope?.label;
  const orderId = scope?.orderId;
  const suggestions = scope?.suggestions?.join("|");

  const apply = useCallback(() => {
    setScope(
      label
        ? { label, orderId, suggestions: suggestions?.split("|") }
        : null,
    );
  }, [setScope, label, orderId, suggestions]);

  useEffect(() => {
    apply();
    return () => setScope(null);
  }, [apply, setScope]);
}
