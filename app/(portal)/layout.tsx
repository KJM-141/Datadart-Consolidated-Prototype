"use client";

import { usePathname } from "next/navigation";
import { PortalFrame, PortalPage } from "@/components/centre/portal-frame";
import { PATHS } from "@/lib/nav";

/**
 * One frame for the whole console.
 *
 * `/customer` is the command centre and lays out its own three columns, so it
 * mounts `PortalFrame` itself and this layout just gets out of the way.
 * Everything under it is an ordinary page and gets the frame with a single
 * scrolling body — same bar, same left rail, same overlays, no second sidebar.
 *
 * `ConsoleShell` is no longer used by any route. It stays in the tree until
 * the public surfaces are converted.
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // `trailingSlash: true` in next.config means the router reports "/customer/".
  const bare = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  if (bare === PATHS.dashboard) return <>{children}</>;

  return (
    <PortalFrame>
      <PortalPage>{children}</PortalPage>
    </PortalFrame>
  );
}
