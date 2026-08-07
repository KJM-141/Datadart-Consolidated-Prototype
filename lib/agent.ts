/**
 * Rules-driven intake agent (WF-1). In production an LLM does the language
 * work, but a deterministic rules engine gates what it may promise — pricing
 * comes only from the pricing service, and credentials are never requested
 * pre-agreement (FR-1.4, D5).
 *
 * This module is that rules engine: slot-filling, validation/normalisation,
 * secret redaction and next-question selection. It is pure and synchronous so
 * it can also power the offline wizard fallback (FR-1.7).
 */
import type { Cadence, TransferFacts } from "./types";

/* ── Secret redaction (FR-1.4) ──────────────────────────────────────────── */

const SECRET_PATTERNS: RegExp[] = [
  /AKIA[0-9A-Z]{16}/g, // AWS access key id
  /\bASIA[0-9A-Z]{16}\b/g, // AWS temp key
  /\b[A-Za-z0-9/+=]{40}\b/g, // AWS secret access key shape
  /\bAIza[0-9A-Za-z\-_]{35}\b/g, // Google API key
  /\bsk-[A-Za-z0-9]{20,}\b/g, // generic secret key
  /\bs3:\/\/\S+/gi, // bucket URI
  /\b[A-Za-z0-9._-]+\.s3\.[a-z0-9.-]*amazonaws\.com\b/gi,
];

export function containsSecret(text: string): boolean {
  return SECRET_PATTERNS.some((re) => {
    re.lastIndex = 0;
    return re.test(text);
  });
}

export function redactSecrets(text: string): string {
  return SECRET_PATTERNS.reduce(
    (acc, re) => acc.replace(re, "[redacted]"),
    text,
  );
}

/* ── Extraction & normalisation (FR-1.2) ────────────────────────────────── */

/** "800 tb", "1.5 PB", "500TB" → TB. */
function parseSize(text: string): number | undefined {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(pb|petabytes?|tb|terabytes?)/i);
  if (!m) return undefined;
  const value = parseFloat(m[1].replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return undefined;
  const isPB = /^p/i.test(m[2]);
  return Math.round(isPB ? value * 1024 : value);
}

const CLOUD_ALIASES: [RegExp, string][] = [
  [/\bus[-\s]?east[-\s]?1\b/i, "AWS — us-east-1"],
  [/\bus[-\s]?west[-\s]?2\b/i, "AWS — us-west-2"],
  [/\beu[-\s]?west[-\s]?1\b/i, "AWS — eu-west-1"],
  [/\bap[-\s]?south[-\s]?1\b/i, "AWS — ap-south-1"],
  [/\bap[-\s]?northeast[-\s]?1\b/i, "AWS — ap-northeast-1"],
  [/\beurope[-\s]?west2\b/i, "GCP — europe-west2"],
  [/\bgermany west\b/i, "Azure — Germany West"],
];

/** Formats destinations as "AWS — us-east-1" (FR-6.4) — never bracket text. */
function parseDestination(text: string): string | undefined {
  for (const [re, label] of CLOUD_ALIASES) if (re.test(text)) return label;
  if (/\bazure\b/i.test(text)) return "Azure";
  if (/\bgcp\b|google cloud/i.test(text)) return "GCP";
  if (/\bs3\b|\baws\b|amazon/i.test(text)) return "AWS";
  if (/\bon[-\s]?prem|data ?cent(er|re)\b/i.test(text)) return "Private data centre";
  return undefined;
}

const SOURCE_TYPES: [RegExp, string][] = [
  [/on[-\s]?prem|nas|san\b/i, "On-prem NAS / SAN"],
  [/data ?cent(er|re)/i, "Data center"],
  [/another cloud|s3|azure|gcp/i, "Another cloud"],
  [/edge|remote site|vessel|field/i, "Edge / remote site"],
];

function parseSourceType(text: string): string | undefined {
  for (const [re, label] of SOURCE_TYPES) if (re.test(text)) return label;
  return undefined;
}

/** Very small city gazetteer — enough to echo a normalised location back. */
const CITIES = [
  "Bengaluru", "Bangalore", "Mumbai", "Pune", "Chennai", "Hyderabad", "Delhi",
  "London", "Manchester", "Frankfurt", "Munich", "Berlin", "Paris",
  "Sydney", "Melbourne", "Singapore", "Tokyo", "Osaka", "Dubai",
  "New York", "Ashburn", "Austin", "Seattle", "San Francisco", "Chicago",
  "Toronto", "Vancouver",
];

function parseLocation(text: string): string | undefined {
  const hit = CITIES.find((c) => new RegExp(`\\b${c}\\b`, "i").test(text));
  if (!hit) return undefined;
  return hit === "Bangalore" ? "Bengaluru" : hit;
}

function parseServiceLevel(
  text: string,
): "Self-managed" | "White Glove" | undefined {
  if (/white\s?glove|on-?site|your engineers|you handle/i.test(text))
    return "White Glove";
  if (/self[-\s]?manage|we'?ll do it|ourselves|our team/i.test(text))
    return "Self-managed";
  return undefined;
}

function parseTimeline(text: string): string | undefined {
  const m = text.match(
    /\b(asap|urgent|this (?:month|quarter)|next (?:month|quarter)|within \d+ \w+|\d+\s*(?:weeks?|months?))\b/i,
  );
  return m ? m[0] : undefined;
}

/**
 * How often the move repeats.
 *
 * Every pattern demands an explicit recurrence marker — "monthly", "every
 * month" — never the bare noun. `parseTimeline` above claims "this month",
 * "next quarter" and "3 months", and a message is read against every parser, so
 * a bare `\bmonth\b` would silently turn the answer to *when* into an answer to
 * *how often*. Recurring cases are tested before the single-shot ones.
 */
const CADENCES: [RegExp, Cadence][] = [
  [
    /\bquarterly\b|\b(?:every|each) quarter\b|\bevery 3 months\b|\b4x?\s*(?:a|per) year\b/i,
    "Quarterly",
  ],
  [
    /\bmonthly\b|\b(?:every|each) month\b|\bevery 30 days\b|\b12x?\s*(?:a|per) year\b/i,
    "Monthly",
  ],
  [
    /\bongoing\b|\bcontinuous(?:ly)?\b|\bconstantly\b|\ball the time\b|\bweekly\b|\b(?:every|each) week\b|\bdaily\b|\bevery day\b|\bregularly\b|\brecurring\b|\brolling basis\b/i,
    "Ongoing",
  ],
  [
    /\bone[-\s]?off\b|\bone[-\s]?time\b|\bjust once\b|\bonly once\b|\bnot recurring\b|\bsingle (?:move|transfer|migration)\b|\bonce\b/i,
    "One-off",
  ],
];

function parseFrequency(text: string): Cadence | undefined {
  for (const [re, label] of CADENCES) if (re.test(text)) return label;
  return undefined;
}

function parseCompliance(text: string): string | undefined {
  if (/hipaa|healthcare|patient|phi\b/i.test(text)) return "Healthcare (HIPAA)";
  if (/gdpr|eu data|europe.*residen/i.test(text)) return "EU / GDPR";
  if (/govcloud|itar|cui\b|federal/i.test(text)) return "Government";
  if (/\bnone\b|no compliance|not regulated/i.test(text)) return "None";
  return undefined;
}

/** Merge everything a single message reveals into the fact sheet. */
export function extractFacts(text: string, current: TransferFacts): TransferFacts {
  const next: TransferFacts = { ...current };
  const size = parseSize(text);
  if (size) next.sizeTB = size;

  const sourceType = parseSourceType(text);
  const location = parseLocation(text);
  const destination = parseDestination(text);
  const sourceKnown = Boolean(current.sourceLocation || current.sourceType);

  // The dialogue asks for the source first, then the destination, so a message
  // is read against whichever slot is still open. Without this split, a reply
  // like "Data center in Bengaluru" fills BOTH — "Data center" reads as a
  // destination kind while "Bengaluru" reads as the location.
  if (!sourceKnown) {
    if (location) next.sourceLocation = location;
    if (sourceType) next.sourceType = sourceType;
  } else if (!current.destination) {
    next.destination = destination ?? location;
  }

  const sl = parseServiceLevel(text);
  if (sl) next.serviceLevel = sl;
  const tl = parseTimeline(text);
  if (tl) next.timeline = tl;
  const fq = parseFrequency(text);
  if (fq) next.frequency = fq;
  const cf = parseCompliance(text);
  if (cf) next.compliance = cf;

  return next;
}

/* ── Next question (dialogue flow A–G) ──────────────────────────────────── */

export type Slot =
  | "size"
  | "sourceLocation"
  | "destination"
  | "serviceLevel"
  | "timeline"
  | "frequency"
  | "compliance"
  | "complete";

export function nextSlot(f: TransferFacts): Slot {
  if (!f.sizeTB) return "size";
  if (!f.sourceLocation) return "sourceLocation";
  if (!f.destination) return "destination";
  if (!f.serviceLevel) return "serviceLevel";
  if (!f.timeline) return "timeline";
  // Asked straight after the timeline: "by when" and "how often" are the same
  // thought, and the answer decides whether this ends as an order or a rental
  // subscription.
  if (!f.frequency) return "frequency";
  if (!f.compliance) return "compliance";
  return "complete";
}

export const SLOT_CHIPS: Partial<Record<Slot, string[]>> = {
  sourceLocation: [
    "On-prem NAS / SAN",
    "Data center",
    "Another cloud",
    "Edge / remote site",
  ],
  destination: [
    "AWS — us-east-1",
    "AWS — eu-west-1",
    "Azure — Germany West",
    "Private data centre",
  ],
  serviceLevel: ["Yes, White Glove", "We'll self-manage", "What's included?"],
  timeline: ["ASAP", "Within 4 weeks", "This quarter"],
  frequency: ["One-off", "Monthly", "Quarterly", "Ongoing"],
  compliance: ["Healthcare (HIPAA)", "EU / GDPR", "Government", "None"],
};

/** Anything other than a single shipment is a rental, not an order. */
export function isRecurring(f: TransferFacts): boolean {
  return Boolean(f.frequency && f.frequency !== "One-off");
}

/** True when we know enough to price (FR-1.5 — before contact capture). */
export function canEstimate(f: TransferFacts): boolean {
  return Boolean(f.sizeTB && f.sourceLocation && f.destination);
}
