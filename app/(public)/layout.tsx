"use client";

import { PublicDeck } from "@/components/advanced/shell/public-deck";

/**
 * Public shell for the pre-agreement surfaces — the sizer, how-it-works and
 * intake. Value before account creation, so none of these require auth.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicDeck>{children}</PublicDeck>;
}
