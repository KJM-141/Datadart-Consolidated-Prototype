import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter_Tight } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="en" suppressHydrationWarning className={`${interTight.variable} ${plexMono.variable}`}>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
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
