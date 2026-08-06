"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowLeftRight,
  BookOpen,
  Box,
  Calculator,
  CalendarClock,
  CornerDownLeft,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Package,
  PlusCircle,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sun,
  UserRound,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { LiveDot } from "@/components/advanced/kit/hud";
import { PRODUCTS } from "@/lib/products";
import { cn } from "@/lib/utils";
import { PATHS } from "@/lib/nav";

const itemClass =
  "group/ci relative gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium " +
  "data-selected:bg-[color-mix(in_oklab,var(--plasma)_14%,transparent)] " +
  "data-selected:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_34%,transparent)] " +
  "data-selected:*:[svg]:text-(--plasma)";

const groupClass =
  "p-1.5 **:[[cmdk-group-heading]]:mb-1 **:[[cmdk-group-heading]]:px-2.5 " +
  "**:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:font-semibold " +
  "**:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-[0.24em] " +
  "**:[[cmdk-group-heading]]:text-muted-foreground/70";

/**
 * The deck's command console. Same destinations and actions as the Normal
 * palette — it is the app's keyboard surface, and changing what ⌘K can reach
 * between modes would be a functional fork, not a visual one. Only the
 * instrument is different: a glass console with an oversized caret field.
 */
export function DeckPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command console"
      description="Jump anywhere in DataDart"
      className="top-[13vh] translate-y-0 overflow-visible rounded-3xl! border-0 bg-transparent p-0 shadow-none sm:max-w-2xl"
    >
      <div className="holo holo-brackets overflow-hidden rounded-3xl">
        <Command className="bg-transparent p-0" loop>
          {/* field */}
          <div className="relative flex items-center gap-3 border-b border-border/70 px-5 py-4">
            <Search className="size-4.5 shrink-0 text-(--plasma)" />
            <CommandPrimitive.Input
              placeholder="Search pages, products, actions…"
              className="w-full bg-transparent text-[15px] outline-hidden placeholder:text-muted-foreground/70"
            />
            <span className="hidden items-center gap-1.5 text-[13px] font-medium text-muted-foreground sm:flex">
              <LiveDot tone="cyo" />
              console
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--plasma)_70%,transparent),transparent)]"
            />
          </div>

          <CommandList className="max-h-[min(60vh,28rem)] p-1.5">
            <CommandEmpty className="py-10 text-center">
              <p className="text-sm font-medium">No results</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Try a product name, a page, or “estimate”.
              </p>
            </CommandEmpty>

            <CommandGroup heading="Navigate" className={groupClass}>
              <Row icon={LayoutDashboard} onSelect={() => go("/customer")}>
                Overview
              </Row>
              <Row icon={ArrowLeftRight} onSelect={() => go("/customer/history")}>
                Transfers
              </Row>
              <Row icon={CalendarClock} onSelect={() => go("/customer/subscriptions")}>
                Subscriptions
              </Row>
              <Row icon={Package} onSelect={() => go("/customer/hardware")}>
                Hardware
              </Row>
              <Row icon={ShoppingCart} onSelect={() => go("/customer/checkout")}>
                My cart
              </Row>
              <Row icon={BookOpen} onSelect={() => go("/customer/resources")}>
                Resources &amp; FAQ
              </Row>
              <Row icon={Inbox} onSelect={() => go("/customer/conversations")}>
                Conversations
              </Row>
              <Row icon={UserRound} onSelect={() => go("/customer/profile")}>
                My profile
              </Row>
            </CommandGroup>

            <CommandGroup heading="Actions" className={groupClass}>
              <Row icon={MessageSquare} onSelect={() => go("/customer/start")}>
                Start a conversation
              </Row>
              <Row icon={Calculator} onSelect={() => go("/customer/sizer")}>
                Get an estimate
              </Row>
              <Row icon={PlusCircle} onSelect={() => go(`${PATHS.transfers}?raise=1`)}>
                Raise an order (classic form)
              </Row>
              <Row icon={PlusCircle} onSelect={() => go(`${PATHS.hardware}?mode=subscribe`)}>
                Subscribe to devices
              </Row>
              <Row
                icon={resolvedTheme === "dark" ? Sun : Moon}
                onSelect={() => {
                  setTheme(resolvedTheme === "dark" ? "light" : "dark");
                  onOpenChange(false);
                }}
              >
                Switch to {resolvedTheme === "dark" ? "Daybreak" : "Midnight"}
              </Row>
              <Row icon={SlidersHorizontal} onSelect={() => go("/")}>
                Switch experience mode
              </Row>
            </CommandGroup>

            <CommandGroup heading="Hardware" className={groupClass}>
              {PRODUCTS.map((p) => (
                <Row
                  key={p.slug}
                  icon={Box}
                  onSelect={() => go(`/customer/hardware/${p.slug}`)}
                  trailing={p.category}
                >
                  {p.name}
                </Row>
              ))}
            </CommandGroup>
          </CommandList>

          {/* keyboard legend */}
          <div className="flex items-center justify-between gap-3 border-t border-border/70 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <Legend keys={["↑", "↓"]}>navigate</Legend>
              <Legend keys={["↵"]}>open</Legend>
              <Legend keys={["esc"]}>close</Legend>
            </div>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 sm:inline">
              Aurora Deck
            </span>
          </div>
        </Command>
      </div>
    </CommandDialog>
  );
}

function Row({
  icon: Icon,
  children,
  onSelect,
  trailing,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onSelect: () => void;
  trailing?: string;
}) {
  return (
    <CommandItem onSelect={onSelect} className={itemClass}>
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted/70 transition-colors group-data-selected/ci:bg-[color-mix(in_oklab,var(--plasma)_20%,transparent)]">
        <Icon className="size-3.5" />
      </span>
      <span className="flex-1 truncate">{children}</span>
      {trailing && (
        <span className="shrink-0 text-[13px] font-medium text-muted-foreground">
          {trailing}
        </span>
      )}
      <CornerDownLeft className="size-3.5 shrink-0 opacity-0 transition-opacity group-data-selected/ci:opacity-60" />
    </CommandItem>
  );
}

function Legend({
  keys,
  children,
}: {
  keys: string[];
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
      {keys.map((k) => (
        <kbd
          key={k}
          className={cn(
            "grid h-4.5 min-w-4.5 place-items-center rounded bg-muted px-1",
            "text-[9px] font-bold ring-1 ring-inset ring-border",
          )}
        >
          {k}
        </kbd>
      ))}
      {children}
    </span>
  );
}
