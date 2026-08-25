import {
  ArrowLeftRight,
  BookOpen,
  Calculator,
  CalendarClock,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  Package,
  ShoppingCart,
} from "lucide-react";

/**
 * ── Navigation, in one place ──────────────────────────────────────────────
 *
 * Every destination in the console, and every path used to reach one.
 *
 * `PATHS` exists so that renaming a route is a single-line change rather than a
 * search across every `href` and `router.push` in the app. Nothing outside this
 * file should contain a literal route string — the console namespace moved once
 * already and would have broken in a dozen places without it.
 */

export const PATHS = {
  /* Public */
  home: "/",
  signin: "/signin",
  signup: "/signup",
  forgot: "/forgotpassword",
  howItWorks: "/how-it-works",

  /* Console. Everything the signed-in product does lives under /customer,
     which is what makes the public surfaces trivially separable from it. */
  dashboard: "/customer",
  transfers: "/customer/history",
  transfer: (id: string) => `/customer/history/${id}`,
  agreement: (id: string) => `/customer/agreement/${id}`,
  subscriptions: "/customer/subscriptions",
  start: "/customer/start",
  sizer: "/customer/sizer",
  conversations: "/customer/conversations",
  hardware: "/customer/hardware",
  product: (slug: string) => `/customer/hardware/${slug}`,
  resources: "/customer/resources",
  checkout: "/customer/checkout",
  profile: "/customer/profile",
  changePassword: "/customer/profile/password",
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "cart";
}

/**
 * The rail's contents. Grouped because a flat list of nine destinations reads
 * as a pile; grouped, it reads as three jobs the console does.
 */
export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { href: PATHS.dashboard, label: "Overview", icon: LayoutDashboard },
      { href: PATHS.transfers, label: "Transfers", icon: ArrowLeftRight },
      { href: PATHS.subscriptions, label: "Subscriptions", icon: CalendarClock },
    ],
  },
  {
    label: "Pipeline",
    items: [
      { href: PATHS.start, label: "New transfer", icon: MessageSquare },
      { href: PATHS.sizer, label: "Sizer", icon: Calculator },
      { href: PATHS.conversations, label: "Conversations", icon: Inbox },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: PATHS.hardware, label: "Hardware", icon: Package },
      { href: PATHS.resources, label: "Resources", icon: BookOpen },
      { href: PATHS.checkout, label: "Cart", icon: ShoppingCart, badge: "cart" },
    ],
  },
];

/**
 * True when `pathname` is inside `href`.
 *
 * Trailing slashes are stripped first: `trailingSlash: true` in next.config
 * means the router reports "/customer/", and an exact comparison against
 * "/customer" silently never matched.
 *
 * The dashboard is an exact match because it is a prefix of every other console
 * route and would otherwise always win.
 */
export function isActivePath(pathname: string, href: string): boolean {
  const trim = (v: string) => (v.length > 1 ? v.replace(/\/+$/, "") : v);
  const p = trim(pathname);
  const h = trim(href);
  return h === trim(PATHS.dashboard) ? p === h : p === h || p.startsWith(`${h}/`);
}

/**
 * Titles for the console routes that have no rail entry.
 *
 * These are reached from a menu, a link or a redirect rather than from the
 * rail, so the top bar's longest-match search finds nothing for them. Ordered
 * most-specific first: `/profile/password` has to be tested before `/profile`.
 */
const OFF_NAV_TITLES: [prefix: string, title: string][] = [
  [PATHS.changePassword, "Change password"],
  [PATHS.profile, "My profile"],
  [`${PATHS.dashboard}/agreement`, "Agreement"],
  [PATHS.howItWorks, "How it works"],
];

export function offNavTitle(pathname: string): string {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  for (const [prefix, title] of OFF_NAV_TITLES) {
    if (p === prefix || p.startsWith(`${prefix}/`)) return title;
  }
  return "Console";
}
