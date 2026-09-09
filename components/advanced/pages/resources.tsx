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
  type LucideIcon,
  MonitorPlay,
  Newspaper,
  PlayCircle,
} from "lucide-react";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import { HudLabel, PageHeading } from "@/components/advanced/kit/hud";
import { Spotlight, Tilt } from "@/components/advanced/kit/interactions";
import { PRODUCTS, productStage } from "@/lib/products";
import { bloomSoft, deckStagger, EASE_ADV, inView } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/* External destinations are placeholders pointing at the public T|Second site
   until official resource URLs are supplied. */
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

/**
 * Resources — the Advanced knowledge hub. Identical content and links; the
 * library is staged as tilting datasheet slabs and an accordion of terminal
 * entries.
 */
export function ResourcesAdvanced() {
  return (
    <motion.div
      variants={deckStagger(0.07)}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <PageHeading
        eyebrow="Knowledge hub"
        title="Resources"
        description="Everything in one place, product datasheets, technical whitepapers, blogs, videos and answers to the questions we hear most."
      />

      {/* Datasheets */}
      <motion.section variants={bloomSoft} className="space-y-4">
        <SectionTitle
          icon={Download}
          label="Downloads"
          title="Product datasheets"
          sub="Full specifications for every device in the family"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {PRODUCTS.map((p) => (
            <Tilt key={p.slug} strength={7}>
              <Spotlight size={300} className="rounded-(--radius)">
                <HoloPanel plain sheen className="group/ds overflow-hidden">
                  <span aria-hidden className="sheen" />
                  <a
                    href={`${SITE}/resources`}
                    target="_blank"
                    rel="noreferrer"
                    className="relative flex min-w-0 items-center gap-4 p-4"
                  >
                    <span
                      className={cn(
                        "relative size-17 shrink-0 overflow-hidden rounded-xl",
                        productStage(p),
                      )}
                    >
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="68px"
                        className="object-contain p-1.5"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">
                        {p.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                        {p.chips[0]}, {p.chips[1]}
                      </span>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-(--plasma)">
                        <Download className="size-3.5" /> Datasheet (PDF)
                      </span>
                    </span>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/ds:opacity-100" />
                  </a>
                </HoloPanel>
              </Spotlight>
            </Tilt>
          ))}
        </div>
      </motion.section>

      {/* Explore */}
      <motion.section variants={bloomSoft} className="space-y-4">
        <SectionTitle
          icon={Newspaper}
          label="Reading"
          title="Learn & explore"
          sub="Stories, demos and deep technical reading from T|Second"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {EXPLORE.map((item, i) => (
            <motion.div
              key={item.title}
              variants={bloomSoft}
              {...inView}
              transition={{ delay: i * 0.05 }}
            >
              <Tilt strength={8}>
                <HoloPanel plain interactive className="group/ex h-full overflow-hidden">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="relative flex h-full flex-col gap-3.5 p-5"
                  >
                    <span className="grid size-11 place-items-center rounded-xl plasma-fill text-white shadow-[0_10px_26px_-12px_color-mix(in_oklab,var(--plasma)_95%,transparent)]">
                      <item.icon className="size-4.5" />
                    </span>
                    <span>
                      <span className="flex items-center gap-1.5 text-[14px] font-semibold">
                        {item.title}
                        <ExternalLink className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/ex:opacity-100" />
                      </span>
                      <span className="mt-1.5 block text-[12.5px] leading-relaxed text-muted-foreground">
                        {item.desc}
                      </span>
                    </span>
                  </a>
                </HoloPanel>
              </Tilt>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section variants={bloomSoft} className="space-y-4">
        <SectionTitle
          icon={LifeBuoy}
          label="Support"
          title="Frequently asked questions"
          sub="Quick answers about orders, subscriptions and the hardware"
        />
        <HoloPanel className="overflow-hidden p-0">
          {FAQS.map((f, i) => (
            <FaqRow
              key={f.q}
              index={i}
              q={f.q}
              a={f.a}
              last={i === FAQS.length - 1}
            />
          ))}
        </HoloPanel>
      </motion.section>
    </motion.div>
  );
}

/**
 * The icon says what the section *is*.
 *
 * A pass that was replacing decorative `Sparkles` with the brand mark caught
 * this component too, and put the dart on all three sections at once. The mark
 * means "DataDart is speaking" — on the assistant, on a note from the product.
 * Used three times on one page as a bullet, it stops meaning anything.
 */
function SectionTitle({
  label,
  title,
  sub,
  icon: Icon,
}: {
  label: string;
  title: string;
  sub: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--plasma)_14%,transparent)] text-(--plasma) ring-1 ring-inset ring-[color-mix(in_oklab,var(--plasma)_30%,transparent)]">
        <Icon className="size-[17px]" />
      </span>
      <div>
        <HudLabel>{label}</HudLabel>
        <h2 className="mt-1 text-[17px] font-semibold tracking-tight">{title}</h2>
        <p className="text-[13px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function FaqRow({
  index,
  q,
  a,
  last,
}: {
  index: number;
  q: string;
  a: string;
  last: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(!last && "border-b border-border/50")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group/faq flex w-full items-center gap-4 px-5 py-4 text-left outline-none transition-colors hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span
          className={cn(
            "shrink-0 text-[11px] font-bold tabular-nums transition-colors",
            open ? "text-(--plasma)" : "text-muted-foreground/45",
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 text-[14px] font-semibold">{q}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-400",
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
            transition={{ duration: 0.32, ease: EASE_ADV }}
          >
            <p className="border-l-2 border-(--plasma) pb-5 pl-12 pr-5 text-[13px] leading-relaxed text-muted-foreground">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
