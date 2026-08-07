"use client";

import { useState } from "react";
import { PanelRight } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAppStore } from "@/lib/store";
import { Conversation } from "./conversation";
import { PortalFrame, usePortal } from "./portal-frame";
import { Workspace, type WorkspaceTab } from "./workspace";

/**
 * ── The command centre ────────────────────────────────────────────────────
 *
 * `/customer`, and the whole of what the console is for.
 *
 * One screen, three columns, one bar. The readout is on the left (shared with
 * every other route, via `PortalFrame`), the catalogue, sizer, library and the
 * operations team are on the right, and the conversation runs down the middle
 * under the four figures worth knowing before you decide what to ask.
 *
 * Detail opens as a lens over the right column, so the transcript never
 * unmounts — which is the entire argument for building this as a screen rather
 * than a page.
 */
export function CommandCentre() {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <PortalFrame
      // The centre column already is the assistant; a floating one over it
      // would be the same conversation twice on one screen.
      dockAssistant={false}
      barAction={
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          aria-label="Open workspace"
          className="grid size-8 place-items-center rounded-md text-ink-2 transition-colors hover:bg-accent hover:text-ink lg:hidden"
        >
          <PanelRight className="size-4" />
        </button>
      }
    >
      <Centre panelOpen={panelOpen} setPanelOpen={setPanelOpen} />
    </PortalFrame>
  );
}

/**
 * Inside the provider, so the conversation and the workspace can reach the
 * frame's lens and product overlays without either owning them.
 *
 * Renders the workspace twice — as the docked column above `lg`, and inside a
 * sheet below it. Both read the same `tab` state, so switching to the sizer on
 * a phone and then rotating to a tablet lands you on the sizer.
 */
function Centre({
  panelOpen,
  setPanelOpen,
}: {
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
}) {
  const { openLens, openProduct } = usePortal();
  const profile = useAppStore((s) => s.profile);

  const [tab, setTab] = useState<WorkspaceTab>("hardware");
  const [injected, setInjected] = useState<string | null>(null);

  return (
    <>
      {/* Signals are built inside `useAssistant` now, so the centre no longer
          threads them down — one source, and no prop to keep in step. */}
      <Conversation
        onOpenLens={openLens}
        injected={injected}
        onInjected={() => setInjected(null)}
        greetingName={profile.firstName}
      />

      <aside className="hidden w-[23rem] shrink-0 border-l border-hair lg:block">
        <Workspace
          tab={tab}
          setTab={setTab}
          onAsk={setInjected}
          onOpenProduct={openProduct}
        />
      </aside>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[23rem] border-hair p-0"
        >
          <SheetTitle className="sr-only">Workspace</SheetTitle>
          <Workspace
            tab={tab}
            setTab={setTab}
            onAsk={(text) => {
              setInjected(text);
              setPanelOpen(false);
            }}
            onOpenProduct={(slug) => {
              openProduct(slug);
              setPanelOpen(false);
            }}
            onClose={() => setPanelOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
