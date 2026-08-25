import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

/**
 * Poppins is the single typeface across the whole product — the same family,
 * the same five weights and the same self-hosted files as the DataDart
 * reference build, so the two prototypes set type identically.
 *
 * Self-hosted rather than fetched from `next/font/google` on purpose: the
 * console has to build and render with no network, and these are the exact
 * files the reference already ships.
 */
const poppins = localFont({
  src: [
    { path: "./fonts/poppins-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/poppins-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/poppins-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://portal.datadart.services"),
  title: {
    default: "DataDart — Integrated Data Transport Solution",
    template: "%s · DataDart",
  },
  description:
    "DataDart by T|Second — move petabytes between data centres and public clouds with rugged BRYCK hardware, one-time transfer orders, and month-to-month device subscriptions.",
  applicationName: "DataDart",
  keywords: [
    "data transport",
    "petabyte transfer",
    "BRYCK",
    "T|Second",
    "data migration",
    "cloud data transfer",
  ],
  openGraph: {
    title: "DataDart — Integrated Data Transport Solution",
    description:
      "Move petabytes between data centres and public clouds with rugged BRYCK hardware.",
    siteName: "DataDart",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a16" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${poppins.variable} ${plexMono.variable}`}>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          {/* Floating assistant — available on every surface except the auth
              pages and /start, which is the same agent at full size. */}
          {/* Toasts sit above the dock so the launcher never covers them. */}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
