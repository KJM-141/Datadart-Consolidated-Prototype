"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { LiveDot } from "@/components/advanced/kit/hud";
import { focusOrder, type LensId } from "@/lib/centre";
import { STAGES, stageIndex } from "@/lib/lifecycle";
import { PATHS } from "@/lib/nav";
import { useAppStore, useMounted } from "@/lib/store";
import { AssistantDock } from "./assistant-dock";
import { AttentionMenu, AttentionStrip } from "./attention";
import { Lens } from "./lens";
import { PageScopeProvider } from "./page-context";
import { ProductModal } from "./product-modal";
import { Sidebar } from "./sidebar";

/**
 * ── The frame ─────────────────────────────────────────────────────────────
 *
 * One bar and one left column, identical on every route under `/customer`.
 *
 * This replaces `ConsoleShell`, which wrapped each page in a nav rail, a top
 * bar, a right rail and a footer — two persistent side columns plus chrome
 * around content that was itself panelled. The right rail is gone entirely and
 * its navigation folded into the signal rail, so a page now has exactly one
 * neighbour.
 *
 * The frame also owns the two overlays, which is why it has to be shared: a
 * signal opens the same lens whether you clicked it from the conversation or
 * from the transfers table, and a product opens the same modal from the
 * workspace, the catalogue or the library. Both are context, not routes, so
 * nothing underneath unmounts.
 *
 * `h-dvh overflow-hidden` is the rule that holds it together: the page never
 * scrolls, each region scrolls itself.
 */

interface PortalApi {
  openLens: (id: LensId) => void;
  openProduct: (slug: string) => void;
}

const PortalContext = createContext<PortalApi>({
  openLens: () => {},
  openProduct: () => {},
});

/** Lets any descendant open a lens or a product without prop-drilling. */
export function usePortal(): PortalApi {
  return useContext(PortalContext);
}

export function PortalFrame({
  children,
  /** Rendered as a third column beside `children`. The centre's workspace. */
  right,
  /** Extra control for the bar, e.g. the workspace trigger on the centre. */
  barAction,
  /**
   * The command centre *is* the assistant, so it suppresses the dock rather
   * than floating a second one over its own middle column.
   */
  dockAssistant = true,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  barAction?: React.ReactNode;
  dockAssistant?: boolean;
}) {
  const signedIn = useAppStore((s) => s.signedIn);
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();
  const router = useRouter();

  const [lens, setLens] = useState<LensId | null>(null);
  const [product, setProduct] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(false);

  useEffect(() => {
    if (mounted && !signedIn) router.replace(PATHS.signin);
  }, [mounted, signedIn, router]);

  // The frame no longer builds signals — the readout column is gone. What
  // survives of it is the command centre's stat strip, which builds its own.
  const focus = focusOrder(orders);

  const openLens = useCallback((id: LensId) => {
    setLens(id);
    setRailOpen(false);
  }, []);
  const openProduct = useCallback((slug: string) => setProduct(slug), []);

  const api = useMemo<PortalApi>(
    () => ({ openLens, openProduct }),
    [openLens, openProduct],
  );

  // Escape closes the topmost overlay. The product modal is above the lens, so
  // it gets the key first; the lens listens only when nothing is over it.
  useEffect(() => {
    if (!lens || product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLens(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lens, product]);

  if (!mounted || !signedIn) return <div className="veil" aria-busy="true" />;

  return (
    <PortalContext.Provider value={api}>
      {/* Pages declare what they are about; the assistant reads it. */}
      <PageScopeProvider>
      {/*
        Sidebar first, full height, brand at its top — so the wordmark sits in
        the true top-left corner of the app and the bar begins where the
        content does. An earlier arrangement ran the bar edge to edge *above*
        the sidebar, which left the corner empty and floated the brand in a
        block of its own halfway down the left edge.
      */}
      <div className="relative flex h-dvh overflow-hidden bg-canvas text-ink">
        <Sidebar className="hidden w-56 shrink-0 border-r border-hair lg:flex" />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <header className="relative z-30 flex h-13 shrink-0 items-center gap-3 border-b border-hair px-3 sm:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => setRailOpen(true)}
                aria-label="Open navigation"
                className="grid size-8 shrink-0 place-items-center rounded-md text-ink-2 transition-colors hover:bg-accent hover:text-ink lg:hidden"
              >
                <PanelLeft className="size-4" />
              </button>

              <div className="lg:hidden">
                <Logo size="sm" href={PATHS.dashboard} />
              </div>

              {focus && (
                <div className="hidden min-w-0 items-baseline gap-2 lg:flex">
                  <span className="shrink-0 font-mono text-[10.5px] text-ink-3">
                    {focus.displayId}
                  </span>
                  <span className="truncate text-[11.5px] text-ink-3">
                    {focus.source.label} → {focus.destination.label}
                  </span>
                </div>
              )}
            </div>

            {focus && (
              <button
                type="button"
                onClick={() => openLens("progress")}
                className="flex shrink-0 items-center gap-2 rounded-md bg-sunk px-2.5 py-1 shadow-[inset_0_0_0_1px_var(--hair)] transition-colors hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_35%,transparent)]"
              >
                <LiveDot tone="success" />
                <span className="truncate text-[11px] text-ink-2">
                  Stage {stageIndex(focus.stage) + 1}/{STAGES.length} · {focus.stage}
                </span>
              </button>
            )}

            <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
              {barAction}
              <AttentionMenu />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1">
            {children}

            {right}

            {/* Inside the content region, so "from the left" already means
                "past the sidebar" without a breakpoint-matched offset. */}
            <Lens id={lens} onClose={() => setLens(null)} />
          </div>
        </div>

        <Sheet open={railOpen} onOpenChange={setRailOpen}>
          <SheetContent side="left" showCloseButton={false} className="w-60 border-hair p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar onNavigate={() => setRailOpen(false)} className="flex" />
          </SheetContent>
        </Sheet>

        <ProductModal slug={product} onClose={() => setProduct(null)} />

        {dockAssistant && <AssistantDock onOpenLens={openLens} />}
      </div>
      </PageScopeProvider>
    </PortalContext.Provider>
  );
}

/**
 * The scrolling body for an ordinary page inside the frame.
 *
 * Pages get one scroll region and a readable measure. `max-w-[1330px]` rather than
 * full-bleed: with the right rail gone there is nothing to stop a table
 * stretching to 1600px, which is how you get rows nobody can track across.
 */
export function PortalPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1330px] px-5 py-6 sm:px-7">
        {/* Renders nothing on routes it has no claim on, which is most of
            them. That is what keeps it from becoming the rail it replaced. */}
        <AttentionStrip />
        {children}
      </div>
    </main>
  );
}
