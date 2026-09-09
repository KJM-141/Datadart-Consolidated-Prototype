"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  LifeBuoy,
  MonitorPlay,
  Newspaper,
  PlayCircle,
} from "lucide-react";
import { Block, PageHead } from "../kit";
import { usePortal } from "../portal-frame";
import { useDeclarePageScope } from "../page-context";
import { PRODUCTS, productStage } from "@/lib/products";
import { bloomSoft, deckStagger, EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── Resources ─────────────────────────────────────────────────────────────
 *
 * The knowledge hub, rebuilt on the block vocabulary.
 *
 * The previous version gave each of three sections a 36px plasma-filled icon
 * badge above a four-part heading, put every external link on a 44px gradient
 * tile, and wrapped the datasheets in a cursor-tracking spotlight and a 3D
 * tilt. Nine saturated glyphs and two pointer effects on a page whose entire
 * job is to hand over four links and seven answers.
 *
 * Same content, same links, same accordion behaviour. What changed is that a
 * section is now a `Block` — boxed icon, small-caps label, one figure — and the
 * rows inside it are a hairline-divided list. The accent survives where it
 * carries meaning: the open FAQ index, the download affordance.
 */

const SITE = "https://tsecond.us";

const EXPLORE = [
  {
    icon: Newspaper,
    title: "Blog",
    desc: "Product news, field stories and engineering deep-dives.",
    href: `${SITE}/blog`,
  },
  {
    icon: PlayCircle,
    title: "Videos",
    desc: "Product walkthroughs and demos on the T|Second website.",
    href: `${SITE}/videos`,
  },
  {
    icon: MonitorPlay,
    title: "YouTube channel",
    desc: "Launches, tutorials and recorded webinars.",
    href: "https://www.youtube.com/results?search_query=tsecond+bryck",
  },
  {
    icon: FileText,
    title: "Tech whitepapers",
    desc: "Architecture papers: BryckCP, petabyte logistics, edge capture.",
    href: `${SITE}/resources`,
  },
];

const FAQS = [
  {
    q: "What is DataDart?",
    a: "DataDart is T|Second's customer portal for moving very large datasets physically. It combines rugged petabyte-scale hardware (the BRYCK family), white-glove logistics, and cloud endpoints so you can capture, transport and land data between private data centres and public clouds.",
  },
  {
    q: "What's the difference between an Order and a Subscription?",
    a: "An Order is a one-time data transfer: you describe the volume, the time window, and the source and destination, and our team executes the move. A Subscription is month-to-month rental of devices shipped to your site, ideal for recurring or unpredictable transfers, with discounts on longer terms.",
  },
  {
    q: "How is my data protected in transit?",
    a: "Every device in the family ships with hardware data encryption, self-healing data protection and RAID 0/1/5/6 support. BRYCK FXR adds an IP67-sealed, MIL-STD-810H rugged enclosure for harsh environments.",
  },
  {
    q: "Which public clouds are supported?",
    a: "AWS, Azure, GCP, IBM Cloud and OCI. You can also request DataDart cloud endpoint support, where our team manages the landing zone in your target cloud for you.",
  },
  {
    q: "How does shipping work?",
    a: "Shipping is free and handled by our logistics team. For subscriptions you provide a shipping destination at checkout; for orders, devices are dispatched to your source site and collected after capture.",
  },
  {
    q: "Can I get in-person help?",
    a: "Yes, when raising an order you can request in-person assistance from T|Second, and our support team will coordinate an engineer for capture and hand-off at your site.",
  },
  {
    q: "How do I cancel an order or subscription?",
    a: "Open the record on the Orders or Subscription page and use the Cancel action in the expanded view, it moves to Closed immediately and our team is notified.",
  },
];

export function ResourcesPage() {
  const { openProduct } = usePortal();

  useDeclarePageScope({
    label: "Resource hub",
    suggestions: [
      "Which clouds can you land in?",
      "What certificates do I get?",
    ],
  });

  return (
    <>
      <PageHead
        eyebrow="Knowledge hub"
        title="Resources"
        description="Everything in one place, product datasheets, technical whitepapers, blogs, videos and answers to the questions we hear most."
      />

      <motion.div
        variants={deckStagger(0.06, 0.04)}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {/* ── Datasheets ─────────────────────────────────────────────── */}
        <motion.div variants={bloomSoft}>
          <Block
            icon={Download}
            label="Product datasheets"
            action={
              <span className="text-[10px] tabular-nums text-ink-3">
                {PRODUCTS.length} devices
              </span>
            }
          >
            <ul className="divide-y divide-hair">
              {PRODUCTS.map((p) => (
                <li key={p.slug}>
                  <button
                    type="button"
                    onClick={() => openProduct(p.slug)}
                    className="group flex w-full min-w-0 items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-sunk"
                  >
                    <span
                      className={cn(
                        "relative size-12 shrink-0 overflow-hidden rounded-md ring-1 ring-inset ring-hair",
                        productStage(p),
                      )}
                    >
                      <Image
                        src={p.image}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-contain p-1.5"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        {p.name}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[10.5px] text-ink-3">
                        {p.chips[0]}, {p.chips[1]}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-(--plasma)">
                      <Download className="size-3.5" />
                      Datasheet
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Block>
        </motion.div>

        {/* ── Explore ────────────────────────────────────────────────── */}
        <motion.div variants={bloomSoft}>
          <Block icon={Newspaper} label="Learn & explore">
            <ul className="grid gap-px bg-hair sm:grid-cols-2">
              {EXPLORE.map((item) => (
                <li key={item.title} className="bg-elev">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex h-full items-start gap-3 px-4 py-3.5 transition-colors hover:bg-sunk"
                  >
                    <item.icon className="mt-0.5 size-4 shrink-0 text-ink-3 transition-colors group-hover:text-(--plasma)" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium">
                        {item.title}
                        <ExternalLink className="size-3 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                      <span className="mt-1 block text-[11.5px] leading-relaxed text-ink-3">
                        {item.desc}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Block>
        </motion.div>

        {/* ── FAQ ────────────────────────────────────────────────────── */}
        <motion.div variants={bloomSoft}>
          <Block
            icon={LifeBuoy}
            label="Frequently asked questions"
            action={
              <span className="text-[10px] tabular-nums text-ink-3">
                {FAQS.length}
              </span>
            }
          >
            <ul className="divide-y divide-hair">
              {FAQS.map((f, i) => (
                <FaqRow key={f.q} index={i} q={f.q} a={f.a} />
              ))}
            </ul>
          </Block>
        </motion.div>
      </motion.div>
    </>
  );
}

function FaqRow({ index, q, a }: { index: number; q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3.5 px-4 py-3 text-left outline-none transition-colors hover:bg-sunk focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span
          className={cn(
            "shrink-0 font-mono text-[10.5px] tabular-nums transition-colors",
            open ? "text-(--plasma)" : "text-ink-3",
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 text-[12.5px] font-medium">{q}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-ink-3 transition-transform duration-300",
            open && "rotate-180 text-(--plasma)",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_ADV }}
            className="overflow-hidden"
          >
            <p className="pb-4 pl-[3.4rem] pr-4 text-[12px] leading-relaxed text-ink-3">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
