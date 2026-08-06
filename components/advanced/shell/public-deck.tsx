"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { ArrowRight, Menu, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AuroraCanvas } from "@/components/advanced/kit/aurora-canvas";
import { Magnetic } from "@/components/advanced/kit/interactions";
import { useAppStore, useMounted } from "@/lib/store";
import { springSnap } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";
import { PATHS } from "@/lib/nav";

/** Same destinations as the Normal public appbar. */
const NAV = [
  { href: "/customer/start", label: "New transfer" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/customer/sizer", label: "Pricing" },
  { href: "/how-it-works#resources", label: "Resources" },
];

/**
 * Public shell for the pre-agreement surfaces, deck edition.
 *
 * The Normal build uses a solid navy appbar; here the bar detaches into a
 * floating glass capsule over the same ambient field the portal runs, so
 * crossing from marketing into the workspace feels continuous.
 */
export function PublicDeck({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const signedIn = useAppStore((s) => s.signedIn);
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();
  const dark = mounted && resolvedTheme === "dark";

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div aria-hidden className="deck-ambience">
        <AuroraCanvas density={4} link={140} opacity={0.5} interactive={110} />
        <div className="hud-grid absolute inset-0 opacity-35" />
        <div className="deck-grain" />
      </div>

      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
        <div className="holo mx-auto flex h-14 max-w-7xl items-center gap-2 rounded-2xl px-2.5 sm:gap-4 sm:px-4">
          {/* mobile menu */}
          <Sheet>
            <SheetTrigger
              aria-label="Open menu"
              className="grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:hidden coarse:size-11"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 bg-transparent p-3">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="holo h-full p-4">
                <Logo size="sm" href="/customer/start" />
                <nav className="mt-6 flex flex-col gap-1">
                  {NAV.map((n) => (
                    <Link
                      key={n.href}
                      href={n.href}
                      className={cn(
                        "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive(n.href)
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {n.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <Link
            href="/customer/start"
            aria-label="DataDart home"
            className="flex shrink-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring coarse:min-h-11"
          >
            <Logo size="sm" href={null} />
          </Link>

          <nav className="hidden items-center gap-0.5 sm:flex">
            {NAV.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-[12px] font-semibold tracking-wide transition-colors duration-300",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="public-nav"
                      transition={springSnap}
                      className="absolute inset-0 -z-10 rounded-full bg-[color-mix(in_oklab,var(--plasma)_14%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_32%,transparent)]"
                    />
                  )}
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-1.5">
            {/* Route back to the experience gateway — present in every mode. */}
            <Magnetic strength={0.2} radius={54}>
              <button
                type="button"
                aria-label={dark ? "Switch to Daybreak" : "Switch to Midnight"}
                onClick={() => setTheme(dark ? "light" : "dark")}
                className="grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground coarse:size-11"
              >
                <motion.span
                  key={dark ? "moon" : "sun"}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  transition={springSnap}
                  className="flex"
                >
                  {dark ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
                </motion.span>
              </button>
            </Magnetic>
            {mounted && signedIn ? (
              <Link
                href="/customer"
                className="btn-plasma inline-flex h-9 shrink-0 items-center gap-1.5 px-4 text-[13px] font-medium"
              >
                <span className="hidden sm:inline">My workspace</span>
                <span className="sm:hidden">Workspace</span>
                <ArrowRight className="size-3.5 shrink-0" />
              </Link>
            ) : (
              <Link
                href={PATHS.signin}
                className="btn-ghost-hud inline-flex h-9 shrink-0 items-center px-4 text-[13px] font-medium"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative flex-1">{children}</main>

      <footer className="relative px-6 pb-5 pt-8">
        <div aria-hidden className="hud-rule mx-auto mb-4 max-w-7xl" />
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>© 2026 DataDart by T|Second</span>
        </div>
      </footer>
    </div>
  );
}
