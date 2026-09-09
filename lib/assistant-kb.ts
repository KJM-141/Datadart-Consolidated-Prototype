/**
 * ── What the assistant knows ──────────────────────────────────────────────
 *
 * One scripted knowledge base, two surfaces: the floating dock that follows you
 * around the console, and the guided "Get started" view on the overview route.
 * Keeping the copy here rather than in either component is the point — the tour
 * and the helper answer the same questions, and two copies of that script would
 * drift apart within a week.
 *
 * The dock is a *guide*, deliberately not a second intake agent. It explains,
 * points and hands off; scoping a real transfer stays with `lib/agent.ts` on the
 * New transfer route, where the slot-filling, redaction and pricing guards live.
 *
 * Pure and synchronous — no network, no model. Every destination comes from
 * `PATHS` so a renamed route cannot leave a dead chip behind.
 */
import { PATHS } from "./nav";
import { STAGES } from "./lifecycle";

export interface GuideAction {
  label: string;
  /** Navigate somewhere in the console. */
  href?: string;
  /** Or branch to another topic in this file. */
  topic?: string;
}

export interface GuideTopic {
  id: string;
  /** Chip text offered to the user for this topic. */
  prompt: string;
  /** Routes a typed question here. */
  match: RegExp;
  /** Markdown — rendered by `components/shared/markdown`. */
  answer: string;
  actions?: GuideAction[];
}

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: "what",
    prompt: "What does DataDart do?",
    match: /what (is|does|are)|about datadart|explain|who are you|overview/i,
    answer:
      "We move **very large datasets** into the cloud on physical hardware, because past a certain size the wire stops being the fast option.\n\nYou tell us how much data, where it lives and where it should land. We ship an encrypted **BRYCK** device, you fill it, we fly it back and upload it at line rate, tracked at every handoff, with a certificate of erasure at the end.",
    actions: [
      { label: "How is it priced?", topic: "pricing" },
      { label: "Scope a transfer", href: PATHS.start },
    ],
  },
  {
    id: "pricing",
    prompt: "How is it priced?",
    match: /pric|cost|quote|estimate|how much|budget|rate|expensive|cheap/i,
    answer:
      "Four lines, no surprises:\n\n- **Device rental**, capacity × duration\n- **Protection**, per device\n- **DT2 port-hours**, the real egress hours, not an allowance\n- **Logistics**, round trip, by lane\n\nYou always get a **range**, not a single number, and you see it before anyone asks for your contact details.",
    actions: [
      { label: "Get an estimate", href: PATHS.sizer },
      { label: "What is a BRYCK?", topic: "hardware" },
    ],
  },
  {
    id: "start",
    prompt: "How do I start a transfer?",
    match: /start|begin|new transfer|first|create|raise|set ?up|kick off/i,
    answer:
      "Two ways in:\n\n1. **New transfer**, talk to the intake assistant. It asks six or seven questions and hands you a priced, sized estimate in about two minutes. No account needed.\n2. **Sizer**, if you already know the numbers, put them in directly and skip the conversation.\n\nEither way you end up at the same proposal.",
    actions: [
      { label: "New transfer", href: PATHS.start },
      { label: "Open the Sizer", href: PATHS.sizer },
    ],
  },
  {
    id: "stages",
    prompt: "What happens after I order?",
    match: /stage|lifecycle|after|next|process|journey|step|what happens|timeline/i,
    answer: `Every transfer runs the same **${STAGES.length} stages**, with an accountable owner at each handoff:\n\n${STAGES.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nYou can watch yours move through them in real time, and each stage releases its own paperwork.`,
    actions: [
      { label: "See my transfers", href: PATHS.transfers },
      { label: "What documents do I get?", topic: "documents" },
    ],
  },
  {
    id: "hardware",
    prompt: "What hardware ships?",
    match: /hardware|bryck|device|equipment|box|drive|mini|fxr|capacity/i,
    answer:
      "Three of them:\n\n- **BRYCK**, up to 1 PB, the workhorse\n- **BRYCK Mini**, 256 TB, 10 lbs, for edge and remote sites\n- **BRYCK FXR**, up to 512 TB with an NVIDIA BlueField DPU, when you need compute alongside the capacity\n\nAll of them rent month-to-month. If your move repeats, renting beats shipping the same fleet back and forth.",
    actions: [
      { label: "Browse hardware", href: PATHS.hardware },
      { label: "How do subscriptions work?", topic: "subscriptions" },
    ],
  },
  {
    id: "subscriptions",
    prompt: "How do subscriptions work?",
    match: /subscription|rent|recur|monthly|plan|ongoing|repeat|how often|again/i,
    answer:
      "If you move data on a schedule, you keep the fleet instead of returning it between runs.\n\nTell the intake assistant **how often** you run the move and it will size a plan for you, the same devices as your estimate, priced per month, on a 12 or 24-month term. You can add it straight to your cart from the conversation.",
    actions: [
      { label: "Scope a recurring move", href: PATHS.start },
      { label: "My subscriptions", href: PATHS.subscriptions },
    ],
  },
  {
    id: "documents",
    prompt: "What documents do I get?",
    match: /document|paperwork|certificate|report|sign|agreement|invoice|custody|proof/i,
    answer:
      "Each one appears as the stage that produces it completes, nothing is promised before it exists:\n\n- **Proposal** and **Rental agreement** up front\n- **Chain of custody** from the moment the device ships\n- **Checksum report** at verification, proving every byte arrived\n- **Erasure certificate** once the device is wiped\n\nAnything waiting on your signature shows up under *Needs you* in the right-hand panel.",
    actions: [{ label: "See my transfers", href: PATHS.transfers }],
  },
  {
    id: "security",
    prompt: "Is my data safe?",
    match: /secur|safe|encrypt|compliance|hipaa|gdpr|risk|privacy|credential|key|trust/i,
    answer:
      "The device is encrypted end to end, custody is logged at every handoff, and the drive is certifiably erased afterwards.\n\nWe also **never ask for credentials or bucket paths in chat**, the intake assistant redacts them automatically if you paste one. Technical access is collected after the agreement is signed, through an audited channel.",
    actions: [{ label: "How does tracking work?", topic: "stages" }],
  },
  {
    id: "human",
    prompt: "Talk to a person",
    match: /human|person|sales|call|contact|someone|agent|support|help me directly/i,
    answer:
      "Of course. Start a conversation and hit **Talk to a human** at the top of the thread, a specialist joins the same chat, with everything you have already told the assistant in front of them. You never repeat yourself.",
    actions: [{ label: "Start a conversation", href: PATHS.start }],
  },
];

/**
 * Route a typed question to a topic.
 *
 * First match wins and `GUIDE_TOPICS` is ordered broad-to-specific, so a
 * question that could belong to two topics lands on the more general one — a
 * slightly wide answer beats a confidently wrong narrow one.
 */
export function findTopic(text: string): GuideTopic | undefined {
  const q = text.trim();
  if (!q) return undefined;
  return GUIDE_TOPICS.find((t) => t.match.test(q));
}

export function getTopic(id: string): GuideTopic | undefined {
  return GUIDE_TOPICS.find((t) => t.id === id);
}

/**
 * What the dock says when it offers help unprompted.
 *
 * Two lines apiece: the offer, and what taking it would actually get you. A
 * bare "Need any help?" asks the reader to guess what this thing knows.
 */
export const GUIDE_NUDGES: { title: string; hint: string }[] = [
  { title: "Need a hand?", hint: "Pricing, timing, hardware, ask away" },
  { title: "Scoping a move?", hint: "Six questions to a priced estimate" },
  { title: "New to DataDart?", hint: "The stages, the paperwork, what ships" },
];

/** Opening line when the dock is first opened. */
export const GUIDE_GREETING =
  "Hi, I'm the DataDart assistant. Ask me anything about how this works, or pick one of these:";

/** Shown when nothing matches. */
export const GUIDE_FALLBACK =
  "I don't have a good answer for that one, I'm the guide, not the estimator. Try one of these, or scope the move properly and I'll price it exactly:";

/** The ordered walkthrough the "Get started" view runs. */
export const TOUR = [
  "what",
  "start",
  "pricing",
  "stages",
  "hardware",
  "subscriptions",
  "documents",
  "security",
] as const;
