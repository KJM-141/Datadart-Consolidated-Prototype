/**
 * ── Carried intent ────────────────────────────────────────────────────────
 *
 * The landing hero lets a visitor ask a real question before they have an
 * account. When they take the nudge to sign up, the question rides along so the
 * account screen can pick up where the conversation left off rather than
 * dropping them on a cold form.
 *
 * sessionStorage, not the persisted store: this is a single-hop breadcrumb
 * between two screens, not a preference. It should evaporate when the tab does,
 * and never survive to a second visit. Guarded for SSR / static export, where
 * `window` is absent at module evaluation.
 */

const KEY = "datadart-intent";

export function setIntent(text: string): void {
  if (typeof window === "undefined") return;
  const t = text.trim();
  try {
    if (t) sessionStorage.setItem(KEY, t);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* private mode / storage disabled — the breadcrumb is best-effort */
  }
}

export function readIntent(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Read once and clear — the breadcrumb is consumed on arrival. */
export function takeIntent(): string | null {
  const v = readIntent();
  if (v) {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
  return v;
}
