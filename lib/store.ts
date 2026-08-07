"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import type {
  CartItem,
  ConversationSession,
  DeviceSubscription,
  TransferOrder,
  UserProfile,
} from "./types";
import {
  DEMO_CONVERSATIONS,
  DEMO_ORDERS,
  DEMO_PROFILE,
  DEMO_SUBSCRIPTIONS,
} from "./demo-data";
import { orderFromConversation } from "./conversation-order";

/** Which of the two dashboard surfaces the overview route is showing. */
export type DashboardView = "guided" | "dashboard";

/** How much the Ultra agent is allowed to decide on your behalf. */
interface AppState {
  signedIn: boolean;
  profile: UserProfile;
  orders: TransferOrder[];
  subscriptions: DeviceSubscription[];
  conversations: ConversationSession[];
  cart: CartItem[];

  /** Right-rail sections the user has folded away, keyed by RailSection id.
   *  Persisted: a panel you closed should stay closed on the next visit. */
  railCollapsed: Record<string, boolean>;
  /** Overview route surface. Defaults to the dashboard for everyone; the
   *  guided tour is always one toggle away rather than gated on being new. */
  dashboardView: DashboardView;
  /** How many times the floating assistant has offered help unprompted. Capped
   *  so the nudge is a courtesy rather than a nag. */
  assistantNudgeSeen: number;

  toggleRailSection: (id: string) => void;
  setDashboardView: (view: DashboardView) => void;
  noteAssistantNudge: () => void;

  signIn: (email: string) => void;
  signOut: () => void;
  updateProfile: (profile: UserProfile) => void;
  addOrder: (order: TransferOrder) => void;
  cancelOrder: (id: string) => void;
  addSubscription: (sub: DeviceSubscription) => void;
  cancelSubscription: (id: string) => void;
  /** Create or update a live intake session (drives the Conversations queue). */
  upsertConversation: (session: ConversationSession) => void;
  /** Turn a session's estimate into a draft order at stage "Proposal". */
  convertToProposal: (displayId: string) => TransferOrder | undefined;
  addToCart: (item: CartItem) => void;
  removeFromCart: (key: string) => void;
  setCartQty: (key: string, qty: number) => void;
  clearCart: () => void;
}

export const cartKey = (item: Pick<CartItem, "productSlug" | "capacityTB">) =>
  `${item.productSlug}${item.capacityTB ? `-${item.capacityTB}` : ""}`;

/**
 * Derives a display name from the address someone signs in with, e.g.
 * "priya.s@acme.io" → "Priya S". Sign-in is simulated, so this is the only
 * identity signal we have — and it keeps any fixture name out of the UI.
 * Falls back to the generic demo identity if the local part is unusable.
 */
function nameFromEmail(email: string): Pick<UserProfile, "firstName" | "lastName"> {
  const local = (email || "").split("@")[0] ?? "";
  const words = local
    .split(/[._+-]+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ""))
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase());

  if (words.length === 0) return { firstName: "Demo", lastName: "User" };
  return { firstName: words[0], lastName: words.slice(1).join(" ") };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      signedIn: false,
      profile: DEMO_PROFILE,
      orders: DEMO_ORDERS,
      subscriptions: DEMO_SUBSCRIPTIONS,
      conversations: DEMO_CONVERSATIONS,
      cart: [],

      railCollapsed: {},
      dashboardView: "dashboard",
      assistantNudgeSeen: 0,

      toggleRailSection: (id) =>
        set((s) => ({
          railCollapsed: { ...s.railCollapsed, [id]: !s.railCollapsed[id] },
        })),
      setDashboardView: (dashboardView) => set({ dashboardView }),
      noteAssistantNudge: () =>
        set((s) => ({ assistantNudgeSeen: s.assistantNudgeSeen + 1 })),

      signIn: (email) =>
        set((s) => ({
          signedIn: true,
          profile: {
            ...s.profile,
            email: email || s.profile.email,
            // Identity follows whoever signed in, so the portal never greets
            // you by a name baked into the demo fixtures.
            ...nameFromEmail(email),
          },
        })),
      signOut: () => set({ signedIn: false }),
      updateProfile: (profile) => set({ profile }),
      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
      cancelOrder: (id) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id || o.displayId === id
              ? { ...o, stage: "Closure", closed: true }
              : o,
          ),
        })),
      addSubscription: (sub) =>
        set((s) => ({ subscriptions: [sub, ...s.subscriptions] })),
      cancelSubscription: (id) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, status: "Closed" } : sub,
          ),
        })),

      upsertConversation: (session) =>
        set((s) => {
          const i = s.conversations.findIndex(
            (c) => c.displayId === session.displayId,
          );
          if (i === -1) return { conversations: [session, ...s.conversations] };
          const next = [...s.conversations];
          next[i] = { ...next[i], ...session };
          return { conversations: next };
        }),

      convertToProposal: (displayId) => {
        const state = get();
        const session = state.conversations.find(
          (c) => c.displayId === displayId,
        );
        if (!session || session.convertedOrderId) return undefined;

        const order = orderFromConversation(session, state.profile);
        set((s) => ({
          orders: [order, ...s.orders],
          conversations: s.conversations.map((c) =>
            c.displayId === displayId
              ? { ...c, state: "contact-captured", convertedOrderId: order.displayId }
              : c,
          ),
        }));
        return order;
      },
      addToCart: (item) =>
        set((s) => {
          const key = cartKey(item);
          const existing = s.cart.find((c) => cartKey(c) === key);
          if (existing) {
            return {
              cart: s.cart.map((c) =>
                cartKey(c) === key ? { ...c, qty: c.qty + item.qty } : c,
              ),
            };
          }
          return { cart: [...s.cart, item] };
        }),
      removeFromCart: (key) =>
        set((s) => ({ cart: s.cart.filter((c) => cartKey(c) !== key) })),
      setCartQty: (key, qty) =>
        set((s) => ({
          cart: s.cart.map((c) =>
            cartKey(c) === key ? { ...c, qty: Math.max(1, qty) } : c,
          ),
        })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "datadart-prototype",
      // v2 introduced the 2.0 order model, v3 the persisted Conversations
      // queue, v4 the Ultra agentic state, v5 the rail/dashboard/assistant UI
      // preferences. Older payloads carry shapes we can't render, so we drop
      // the stale records and reseed rather than show broken rows.
      version: 5,
      migrate: (persisted) => {
        const prev = (persisted ?? {}) as Partial<AppState>;
        return {
          ...prev,
          orders: DEMO_ORDERS,
          subscriptions: DEMO_SUBSCRIPTIONS,
          conversations: DEMO_CONVERSATIONS,
          cart: [],
          // Spelled out rather than left to the `...prev` spread: persist's
          // merge is a shallow overwrite, so a pre-v5 payload would otherwise
          // leave these `undefined` and every read would have to guard.
          railCollapsed: prev.railCollapsed ?? {},
          dashboardView: prev.dashboardView ?? "dashboard",
          assistantNudgeSeen: prev.assistantNudgeSeen ?? 0,
        } as AppState;
      },
    },
  ),
);

/** True once the component is mounted client-side — guards persisted state
 *  (cart badge, auth redirects) against SSR hydration mismatches. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
