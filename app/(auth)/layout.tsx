"use client";

import { AuthStage } from "@/components/advanced/auth/auth-stage";

/** Full-bleed cinematic stage behind every auth surface. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthStage>{children}</AuthStage>;
}
