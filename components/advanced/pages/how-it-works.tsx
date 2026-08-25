"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  ArrowRight,
  Calculator,
  Download,
  ExternalLink,
  FileText,
  Lock,
  MessageSquare,
  Newspaper,
  PlayCircle,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { AuroraCanvas } from "@/components/advanced/kit/aurora-canvas";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import { HudLabel, LiveDot } from "@/components/advanced/kit/hud";
import { WordReveal } from "@/components/advanced/kit/text";
import { Spotlight, Tilt } from "@/components/advanced/kit/interactions";
import { STAGES } from "@/lib/lifecycle";
import { PRODUCTS, productStage } from "@/lib/products";
import { bloomSoft, deckStagger, EASE_ADV, inView, useSafeReducedMotion } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

const SITE = "https://tsecond.ai";

const STEPS = [
  {
    icon: MessageSquare,
    title: "Converse",
    body: "Tell our assistant how much data you have and where it needs to go. No forms, no credentials, no sales call.",
  },
  {
    icon: Calculator,
    title: "Size & price",
    body: "The sizer picks the right BRYCK fleet and returns a ballpark range plus a door-to-door timeline — before we ask for your details.",
  },
  {
    icon: FileText,
    title: "Agree",
    body: "Proposal, rental agreement and SLA are e-signed in-portal. The advance invoice issues automatically on signature.",
  },
  {
    icon: Truck,
    title: "Transfer & track",
    body: "We provision and ship. You watch all ten stages live — including copy progress straight off the device.",
  },
];

const TRUST = [
  { icon: Lock, label: "AES-256", sub: "Hardware encryption end-to-end" },
  { icon: ShieldCheck, label: "Chain of custody", sub: "Every handoff logged and signed" },
  { icon: FileText, label: "Certified erasure", sub: "Downloadable certificate at closure" },
  { icon: ShieldCheck, label: "MIL-STD-810", sub: "Rugged transport on BRYCK FXR" },
];

const RESOURCES = [
  {
    icon: Newspaper,
    title: "Blog",
    desc: "Product news, field stories and engineering deep-dives.",
    href: `${SITE}/blog`,
  },
  {
    icon: PlayCircle,
    title: "Videos & demos",
    desc: "Product walkthroughs on the T|Second site.",
    href: `${SITE}/resources`,
  },
  {
    icon: FileText,
    title: "Tech whitepapers",
    desc: "BryckCP, petabyte logistics, edge capture.",
    href: `${SITE}/resources`,
  },
];

/**
 * How it works — the Advanced narrative.
 *
 * Same four-step story, ten-stage strip, trust row, datasheets and closing CTA.
 * Rebuilt as a scroll-revealed sequence: the steps are beam-linked nodes and
 * the lifecycle strip ignites segment by segment as it enters the viewport.
 */
export function HowItWorksAdvanced() {
  const reduce = useSafeReducedMotion();

  return (
    <motion.div
      variants={deckStagger(0.07)}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-[1330px] px-4 py-12 sm:px-6 sm:py-16"
    >
      {/* ── Hero ────────────────────────────────────────────────── */}
      <motion.div variants={bloomSoft} className="relative max-w-3xl">
        <div className="flex items-center gap-2">
          <LiveDot tone="cyo" />
          <HudLabel>How it works</HudLabel>
        </div>
        <WordReveal
          text="Petabytes moved like premium logistics."
          highlight={(w) => /premium|logistics/i.test(w)}
          className="mt-3 text-[2.1rem] font-semibold leading-[1.06] tracking-tight sm:text-[3rem]"
        />
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Every order has a visible journey, every handoff has an owner, and
          every promise — speed, security, certified erasure — is backed by a
          downloadable artifact.
        </p>
        <div className="mt-7 flex flex-wrap gap-2.5">
          <Link
            href="/customer/start"
            className="btn-plasma group inline-flex h-12 items-center gap-2 px-7 text-[13px] font-medium text-white"
          >
            Start a conversation
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/customer/sizer"
            className="btn-ghost-hud inline-flex h-12 items-center px-7 text-[13px] font-medium"
          >
            Get an estimate
          </Link>
        </div>
      </motion.div>

      {/* ── Four steps, beam-linked ─────────────────────────────── */}
      <div className="relative mt-14">
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-9 hidden h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--plasma)_55%,transparent),color-mix(in_oklab,var(--cyo)_45%,transparent),transparent)] xl:block"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              variants={bloomSoft}
              {...inView}
              transition={{ delay: i * 0.08 }}
            >
              <Tilt strength={6} glare={false} className="h-full">
                <Spotlight size={280} className="h-full rounded-(--radius)">
                  <HoloPanel plain className="h-full p-5">
                    <div className="flex items-center justify-between">
                      <span className="relative grid size-11 place-items-center rounded-xl plasma-fill text-white shadow-[0_10px_26px_-12px_color-mix(in_oklab,var(--plasma)_95%,transparent)]">
                        <s.icon className="size-4.5" />
                        {!reduce && (
                          <span className="adv-ping absolute inset-0 rounded-xl plasma-fill opacity-40" />
                        )}
                      </span>
                      <span className="text-[2rem] font-semibold leading-none tabular-nums text-muted-foreground/20">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h2 className="mt-4 text-[15px] font-semibold tracking-tight">
                      {s.title}
                    </h2>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      {s.body}
                    </p>
                  </HoloPanel>
                </Spotlight>
              </Tilt>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Ten-stage strip ─────────────────────────────────────── */}
      <motion.div variants={bloomSoft} {...inView} className="mt-10">
        <HoloPanel plain scan className="relative overflow-hidden p-5 sm:p-7">
          <span aria-hidden className="hud-grid absolute inset-0 opacity-40" />
          <div className="relative">
            <HudLabel>Lifecycle</HudLabel>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight">
              Ten tracked stages, start to finish
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You always know where your data is and what happens next.
            </p>

            <div className="mt-6 flex gap-1.5">
              {STAGES.map((s, i) => (
                <motion.span
                  key={s}
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 0.4 + (i / STAGES.length) * 0.6 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: EASE_ADV, delay: i * 0.06 }}
                  className="h-2 flex-1 origin-left rounded-full plasma-fill"
                />
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
              {STAGES.map((s, i) => (
                <p key={s} className="text-[11px] text-muted-foreground">
                  <span className="font-bold tabular-nums text-(--plasma)">
                    {String(i + 1).padStart(2, "0")}
                  </span>{" "}
                  {s}
                </p>
              ))}
            </div>
          </div>
        </HoloPanel>
      </motion.div>

      {/* ── Trust strip ─────────────────────────────────────────── */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TRUST.map((t, i) => (
          <motion.div
            key={`${t.label}-${i}`}
            variants={bloomSoft}
            {...inView}
            transition={{ delay: i * 0.06 }}
          >
            <HoloPanel plain className="flex h-full items-start gap-3 p-4">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--cyo)_14%,transparent)] text-(--cyo) ring-1 ring-inset ring-[color-mix(in_oklab,var(--cyo)_30%,transparent)]">
                <t.icon className="size-4" />
              </span>
              <span>
                <span className="block text-[13px] font-semibold">{t.label}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                  {t.sub}
                </span>
              </span>
            </HoloPanel>
          </motion.div>
        ))}
      </div>

      {/* ── Resources ───────────────────────────────────────────── */}
      <motion.section
        variants={bloomSoft}
        {...inView}
        id="resources"
        className="mt-16 scroll-mt-24"
      >
        <HudLabel>Library</HudLabel>
        <h2 className="mt-1.5 text-[1.75rem] font-semibold tracking-tight">
          Resources
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Datasheets, whitepapers, blogs and videos — everything in one place.
        </p>

        <h3 className="mt-7">
          <HudLabel>Product datasheets</HudLabel>
        </h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {PRODUCTS.map((p) => (
            <Tilt key={p.slug} strength={7}>
              <HoloPanel plain sheen className="group/ds overflow-hidden">
                <span aria-hidden className="sheen" />
                <a
                  href={p.detailsUrl ?? `${SITE}/resources`}
                  target="_blank"
                  rel="noreferrer"
                  className="relative flex min-w-0 items-center gap-4 p-4"
                >
                  <span
                    className={cn(
                      "relative size-16 shrink-0 overflow-hidden rounded-xl",
                      productStage(p),
                    )}
                  >
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="64px"
                      className="object-contain p-1.5"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">
                      {p.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      {p.chips[0]} · {p.chips[1]}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-(--plasma)">
                      <Download className="size-3.5" /> Datasheet (PDF)
                    </span>
                  </span>
                </a>
              </HoloPanel>
            </Tilt>
          ))}
        </div>

        <h3 className="mt-9">
          <HudLabel>Learn &amp; explore</HudLabel>
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {RESOURCES.map((r) => (
            <Tilt key={r.title} strength={8}>
              <HoloPanel plain interactive className="group/ex h-full">
                <a
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  className="relative flex h-full flex-col gap-3.5 p-5"
                >
                  <span className="grid size-11 place-items-center rounded-xl plasma-fill text-white shadow-[0_10px_26px_-12px_color-mix(in_oklab,var(--plasma)_95%,transparent)]">
                    <r.icon className="size-4.5" />
                  </span>
                  <span>
                    <span className="flex items-center gap-1.5 text-[14px] font-semibold">
                      {r.title}
                      <ExternalLink className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/ex:opacity-100" />
                    </span>
                    <span className="mt-1.5 block text-[12.5px] leading-relaxed text-muted-foreground">
                      {r.desc}
                    </span>
                  </span>
                </a>
              </HoloPanel>
            </Tilt>
          ))}
        </div>
      </motion.section>

      {/* ── Closing CTA ─────────────────────────────────────────── */}
      <motion.section variants={bloomSoft} {...inView} className="mt-16">
        <HoloPanel
          plain
          variant="plasma"
          sheen
          className="relative overflow-hidden p-8 text-white sm:p-12"
        >
          <span aria-hidden className="sheen" />
          <span aria-hidden className="hud-dots absolute inset-0 opacity-20" />
          <div aria-hidden className="absolute inset-0">
            <AuroraCanvas
              density={7}
              link={110}
              colors={["#ffffff", "#d8c4ff", "#a5f3fc"]}
              opacity={0.55}
              interactive={0}
            />
          </div>
          <div className="relative max-w-xl">
            <HudLabel className="text-white/70">Ready when you are</HudLabel>
            <h2 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-[2.25rem]">
              Get your estimate in two minutes.
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-white/85">
              No account needed. Talk to the assistant, or run the numbers
              yourself in the sizer.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link
                href="/customer/start"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[13px] font-medium text-[#100e22] transition-transform duration-300 hover:scale-[1.03]"
              >
                Start a conversation <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/customer/sizer"
                className="inline-flex h-12 items-center rounded-full px-7 text-[13px] font-medium text-white ring-1 ring-white/40 transition-colors hover:bg-white/12"
              >
                Open the sizer
              </Link>
            </div>
          </div>
        </HoloPanel>
      </motion.section>
    </motion.div>
  );
}
