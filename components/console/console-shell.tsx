"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AssistantDock } from "@/components/assistant/assistant-dock";
import { DeckPalette } from "@/components/advanced/shell/deck-palette";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { isActivePath, PATHS } from "@/lib/nav";
import { railVisible } from "@/lib/rail-spec";
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
  const pathname = usePathname();
  const railHere = railVisible(pathname);
  // The overview's guided view *is* the assistant, and its dashboard view is a
  // scan surface a chat launcher only crowds. A floating dock there is a second
  // copy of the same agent on the one screen that already leads with it — so it
  // stands down on the overview and stays available on every task route.
  const onOverview = isActivePath(pathname, PATHS.dashboard);

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

        Light is the exception to the translucency above, and deliberately so:
        paper has no aurora to separate the columns with — less so now that the
        field is gone — so `--chrome` resolves to an opaque tint a rung below the
        canvas rather than 72% of it. See the surface ladder in tokens.css.
      */}
      <div aria-hidden className="deck-ambience">
        <div className="nightfall" />
      </div>

      <TopBar
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenNav={() => setNavOpen(true)}
        // No trigger where there is no rail to open — a button that reveals an
        // empty sheet is worse than no button.
        onToggleRail={railHere ? () => setRailOpen(true) : undefined}
        className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-chrome-edge px-3 backdrop-blur-xl"
      />

      <div className="relative flex min-h-0 flex-1">
        <NavRail className="hidden w-64 shrink-0 border-r border-chrome-edge backdrop-blur-xl lg:flex" />

        {/* The working surface. `min-w-0` so a wide table shrinks this column
            instead of pushing the rails off the frame.

            No footer. A console fills the viewport exactly once and every
            region scrolls itself, so a standing bar of copyright and the word
            "Console" spent 40px of permanent vertical budget telling you which
            application you already had open. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {children}
          </main>
        </div>

        {/* The overview's column, and nowhere else. Every other route prints
            its own subject at full width, so the rail was restating it in
            miniature — twice over on the transfer detail. */}
        {railHere && (
          <RightRail className="hidden shrink-0 border-l border-chrome-edge backdrop-blur-xl xl:flex" />
        )}
      </div>

      {/* Below the breakpoints, both rails are reachable as sheets. */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-72 border-hair p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <NavRail onNavigate={() => setNavOpen(false)} className="flex" />
        </SheetContent>
      </Sheet>

      <Sheet open={railHere && railOpen} onOpenChange={setRailOpen}>
        <SheetContent side="right" showCloseButton={false} className="w-[22rem] border-hair p-0">
          <SheetTitle className="sr-only">Panel</SheetTitle>
          <RightRail className="flex w-full" forceExpanded />
        </SheetContent>
      </Sheet>

      {/*
        Fixed, and last in the tree. It sits at z-40 — under the z-50 the sheets
        and dialogs use, so an open overlay still owns the screen — and being
        fixed it contributes nothing to `scrollHeight`, which the layout
        contract in verify.mjs asserts is never taller than the viewport.
      */}
      {!onOverview && <AssistantDock />}

      <DeckPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
