"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DeckPalette } from "@/components/advanced/shell/deck-palette";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { PATHS } from "@/lib/nav";
import { useAppStore, useMounted } from "@/lib/store";
import { NavRail } from "./nav-rail";
import { RightRail } from "./right-rail";
import { TopBar } from "./top-bar";

/**
 * ── The console ───────────────────────────────────────────────────────────
 *
 * Three columns under one bar, filling the viewport exactly once.
 *
 * `h-dvh overflow-hidden` on the frame is the whole idea: the page never
 * scrolls, each region scrolls itself, and the bars and rails stay put without
 * a single `position: sticky`. That is what separates a console from a
 * document, and it is the structure this build took from the Vercel app.
 *
 * The skin is the Aurora Deck's, unchanged — the same aurora field behind
 * everything, the same glass panels, the same plasma accent. What changed is
 * that they now sit in a frame instead of floating in a column.
 *
 * Below `lg` the nav becomes a sheet; below `xl` so does the right rail. The
 * centre column is never sacrificed, because it is the only region that cannot
 * be reached another way.
 */
export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const signedIn = useAppStore((s) => s.signedIn);
  const mounted = useMounted();
  const router = useRouter();

  useEffect(() => {
    if (mounted && !signedIn) router.replace(PATHS.signin);
  }, [mounted, signedIn, router]);

  if (!mounted || !signedIn) {
    return <div className="veil" aria-busy="true" />;
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden text-ink">
      {/*
        Ambient world. Fixed and behind everything, so no region owns it.

        Nothing above this may carry an opaque background: the shell root used
        to set `bg-canvas` and painted straight over the lot, which is why the
        console read as dead black. The rails and bars are translucent for the
        same reason — the night has to be visible through the frame, not just
        around it.

        Reduced to the base gradient. The drifting starfield, the aurora
        particle field, the HUD grid and the grain were four animated layers
        behind every page of a logistics console — texture competing with the
        figures it sat behind. `nightfall` alone keeps the depth without any of
        the noise, and takes a canvas render loop off every route.
      */}
      <div aria-hidden className="deck-ambience">
        <div className="nightfall" />
      </div>

      <TopBar
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenNav={() => setNavOpen(true)}
        onToggleRail={() => setRailOpen(true)}
        className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-hair px-3 backdrop-blur-xl"
      />

      <div className="relative flex min-h-0 flex-1">
        <NavRail className="hidden w-64 shrink-0 border-r border-hair backdrop-blur-xl lg:flex" />

        {/* The working surface. `min-w-0` so a wide table shrinks this column
            instead of pushing the rails off the frame. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {children}
          </main>

          <footer className="shrink-0 border-t border-hair px-5 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
              <span>© 2026 DataDart by T|Second</span>
              <span className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full plasma-fill" />
                Console
              </span>
            </div>
          </footer>
        </div>

        <RightRail className="hidden w-[22rem] shrink-0 border-l border-hair backdrop-blur-xl xl:flex" />
      </div>

      {/* Below the breakpoints, both rails are reachable as sheets. */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-72 border-hair p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <NavRail onNavigate={() => setNavOpen(false)} className="flex" />
        </SheetContent>
      </Sheet>

      <Sheet open={railOpen} onOpenChange={setRailOpen}>
        <SheetContent side="right" showCloseButton={false} className="w-[22rem] border-hair p-0">
          <SheetTitle className="sr-only">Panel</SheetTitle>
          <RightRail className="flex" />
        </SheetContent>
      </Sheet>

      <DeckPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
