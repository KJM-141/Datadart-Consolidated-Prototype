"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Label } from "./kit";
import { PATHS } from "@/lib/nav";
import { PRODUCTS, productStage } from "@/lib/products";
import { EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The library ───────────────────────────────────────────────────────────
 *
 * Was three flat lists — datasheets, questions, links — where the questions
 * were links to a page that had the same questions on it. Reading an answer
 * cost a navigation out of the console and a scroll to find the row again.
 *
 * Now it answers in place. One field filters everything at once; a question
 * opens its answer inline; and every answer offers to hand the topic to the
 * assistant, which is the one thing a static hub cannot do — ask it about
 * *your* transfer rather than in general.
 *
 * Search matters more here than the row count suggests. The panel is 23rem, so
 * only four or five rows are visible at a time; typing two characters is faster
 * than scrolling three sections, and it is the same gesture for all three
 * kinds of thing.
 */

const SITE = "https://tsecond.us";

interface Answer {
  q: string;
  a: string;
  /** What to hand the assistant. Phrased as the user would ask it. */
  ask: string;
}

const ANSWERS: Answer[] = [
  {
    q: "Order or subscription?",
    a: "An order is a one-time transfer — you describe the volume, window and endpoints and our team executes the move. A subscription is month-to-month device rental shipped to your site, for recurring or unpredictable work.",
    ask: "Should I raise an order or take a subscription?",
  },
  {
    q: "How is my data protected in transit?",
    a: "Hardware AES-256 encryption on every device, self-healing data protection and RAID 0/1/5/6. FXR adds a sealed MIL-STD-810 enclosure with epoxy potting against tampering.",
    ask: "How is my data protected in transit?",
  },
  {
    q: "Which clouds can you land in?",
    a: "AWS, Azure, GCP, IBM Cloud and OCI. We can also manage the landing zone in your target cloud for you.",
    ask: "Which clouds can you land my data in?",
  },
  {
    q: "How does shipping work?",
    a: "Shipping is included and handled by our logistics team. Devices are dispatched to your source site and collected after capture, with chain-of-custody tracking throughout.",
    ask: "How does shipping work for my transfer?",
  },
  {
    q: "When do I pay?",
    a: "Half on signature, half when the transfer reaches Verification. Line items are fixed at signature and do not re-price mid-transfer.",
    ask: "When do I pay, and what's outstanding on my transfers?",
  },
  {
    q: "What certificates do I get?",
    a: "A chain-of-custody log, a checksum report comparing source and destination end to end, and an erasure certificate once the device is wiped. All downloadable for the life of the account.",
    ask: "What certificates will I get, and which are ready?",
  },
  {
    q: "Can I get someone on site?",
    a: "Yes — White Glove puts our engineers at your site to run the data load. You can switch a transfer to White Glove at any point before Provisioning.",
    ask: "What does White Glove include?",
  },
];

const LINKS = [
  { label: "Blog", href: `${SITE}/blog` },
  { label: "Videos", href: `${SITE}/videos` },
  { label: "Tech whitepapers", href: `${SITE}/resources` },
  { label: "Resource hub", href: PATHS.resources, internal: true },
];

const norm = (s: string) => s.toLowerCase();

export function Library({
  onAsk,
  onOpenProduct,
}: {
  onAsk: (text: string) => void;
  onOpenProduct: (slug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const q = norm(query.trim());

  const { products, answers, links } = useMemo(() => {
    if (!q) return { products: PRODUCTS, answers: ANSWERS, links: LINKS };
    return {
      products: PRODUCTS.filter((p) =>
        norm(`${p.name} ${p.tagline} ${p.chips.join(" ")}`).includes(q),
      ),
      // Search the answer body too — people search for the term they half
      // remember ("erasure", "RAID"), which is rarely in the question.
      answers: ANSWERS.filter((a) => norm(`${a.q} ${a.a}`).includes(q)),
      links: LINKS.filter((l) => norm(l.label).includes(q)),
    };
  }, [q]);

  const nothing = !products.length && !answers.length && !links.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg bg-sunk px-2.5 py-1.5 shadow-[inset_0_0_0_1px_var(--hair)] transition-shadow focus-within:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_50%,transparent)]">
        <Search className="size-3.5 shrink-0 text-ink-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the library"
          aria-label="Search the library"
          className="min-w-0 flex-1 bg-transparent py-1 text-[12px] outline-none placeholder:text-ink-3"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="grid size-5 shrink-0 place-items-center rounded text-ink-3 transition-colors hover:text-ink"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {nothing && (
        <div className="rounded-lg px-3 py-4 text-center ring-1 ring-inset ring-hair">
          <p className="text-[12px] text-ink-3">
            Nothing in the library matches that.
          </p>
          <button
            type="button"
            onClick={() => {
              onAsk(query);
              setQuery("");
            }}
            className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-(--plasma) hover:underline"
          >
            <Sparkles className="size-3" />
            Ask the assistant instead
          </button>
        </div>
      )}

      {answers.length > 0 && (
        <section>
          <Label className="mb-1.5 px-1">Answers</Label>
          <ul className="overflow-hidden rounded-lg ring-1 ring-inset ring-hair">
            {answers.map((a, i) => (
              <li
                key={a.q}
                className={cn(i > 0 && "border-t border-hair")}
              >
                <button
                  type="button"
                  onClick={() => setOpen(open === a.q ? null : a.q)}
                  aria-expanded={open === a.q}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-sunk"
                >
                  <span className="flex-1 text-[12px] leading-snug">{a.q}</span>
                  <ChevronDown
                    className={cn(
                      "size-3 shrink-0 text-ink-3 transition-transform duration-200",
                      open === a.q && "rotate-180 text-(--plasma)",
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {open === a.q && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.26, ease: EASE_ADV }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3">
                        <p className="text-[11.5px] leading-relaxed text-ink-3">
                          {a.a}
                        </p>
                        <button
                          type="button"
                          onClick={() => onAsk(a.ask)}
                          className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-(--plasma) transition-colors hover:text-ink"
                        >
                          <Sparkles className="size-3" />
                          Ask about my transfers
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ul>
        </section>
      )}

      {products.length > 0 && (
        <section>
          <Label className="mb-1.5 px-1">Datasheets</Label>
          <ul className="space-y-1">
            {products.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => onOpenProduct(p.slug)}
                  className="group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
                >
                  <span
                    className={cn(
                      "relative size-8 shrink-0 overflow-hidden rounded ring-1 ring-inset ring-hair",
                      productStage(p),
                    )}
                  >
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-contain p-1"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium">
                      {p.name}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-ink-3">
                      {p.chips[0]}
                    </span>
                  </span>
                  <ArrowUpRight className="size-3 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {links.length > 0 && (
        <section>
          <Label className="mb-1.5 px-1">Elsewhere</Label>
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  {...(l.internal
                    ? {}
                    : { target: "_blank", rel: "noopener noreferrer" })}
                  className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-ink-2 transition-colors hover:bg-accent hover:text-ink"
                >
                  {l.label}
                  {l.internal ? (
                    <ArrowUpRight className="ml-auto size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  ) : (
                    <ExternalLink className="ml-auto size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
