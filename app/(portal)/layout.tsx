"use client";

import { ConsoleShell } from "@/components/console/console-shell";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
