import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DataDart — Move petabytes at the speed of a flight",
  description:
    "DataDart by T|Second moves very large datasets on encrypted BRYCK hardware. Describe your transfer in chat, get a sized plan and a price, and let the assistant draft your full proposal.",
};

/**
 * ── Marketing shell ───────────────────────────────────────────────────────
 *
 * The landing is light (`on-light`), the neutral register with the Tsecond
 * brand as the accent. It re-declares the light tokens for this subtree so it is
 * light regardless of the app theme.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="on-light min-h-dvh bg-canvas text-ink [color-scheme:light]">
      {children}
    </div>
  );
}
