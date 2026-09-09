import { RESERVED_DISPLAY_IDS } from "./lifecycle";
import type {
  ActivityItem,
  ConversationSession,
  DeviceSubscription,
  OrderDocument,
  PaymentMilestone,
  TransferOrder,
  UserProfile,
} from "./types";

/** Demo account matching the analysed portal account. */
export const DEMO_PROFILE: UserProfile = {
  firstName: "Demo",
  lastName: "User",
  email: "demo.user@example.com",
  countryCode: "+91",
  phone: "9000000001",
  address: {
    address: "Sattva Knowledge Court",
    area: "Salarpuria",
    landmark: "",
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    pincode: "560048",
  },
};

const addr = (
  country: string,
  state: string,
  city: string,
  address: string,
  pincode: string,
) => ({ address, area: "", landmark: "", country, state, city, pincode });

const contact = (name: string, email: string, phone: string) => ({
  name,
  email,
  phone,
});

/** Documents appear the moment they exist; the rest advertise their stage. */
const docs = (available: OrderDocument["type"][], pendingMap: Partial<Record<OrderDocument["type"], OrderDocument["availableAtStage"]>> = {}): OrderDocument[] => {
  const all: OrderDocument["type"][] = [
    "Proposal",
    "Rental agreement",
    "Service SLA",
    "DPA",
    "Chain of custody",
    "Checksum report",
    "Erasure certificate",
    "Invoice",
  ];
  return all
    .filter((t) => available.includes(t) || t in pendingMap)
    .map((type) => ({
      type,
      status: available.includes(type)
        ? type === "Rental agreement" || type === "Service SLA" || type === "DPA"
          ? "signed"
          : "available"
        : "pending",
      availableAtStage: pendingMap[type],
    }));
};

const pay = (
  advance: number,
  advanceStatus: PaymentMilestone["status"],
  balance: number,
  balanceStatus: PaymentMilestone["status"],
): PaymentMilestone[] => [
  { label: "Advance (50%)", amount: advance, status: advanceStatus },
  {
    label: "Balance (50%)",
    amount: balance,
    status: balanceStatus,
    dueAtStage: "Verification",
  },
];

export const DEMO_ORDERS: TransferOrder[] = [
  {
    id: "9f2c1a7e-4d33-4b0a-9a11-6c5e8b71d204",
    displayId: "DD-2026-0187",
    createdAt: "2026-07-18",
    volumeTB: 800,
    availableFrom: "2026-07-20",
    moveBy: "2026-08-05",
    inPersonAssist: true,
    serviceLevel: "White Glove",
    source: {
      kind: "Private data centre",
      location: addr("India", "Karnataka", "Bengaluru", "Sattva Knowledge Court", "560048"),
      contact: contact("Contact A", "contact.a@example.com", "+91 90000 00001"),
      label: "Bengaluru, IN",
    },
    destination: {
      kind: "Public cloud",
      cloudProvider: "AWS",
      cloudEndpointSupport: true,
      location: addr("United States", "Virginia", "Ashburn", "21715 Filigree Ct", "20147"),
      contact: contact("Contact B", "contact.b@example.com", "+1 555 010 0002"),
      label: "AWS us-east-1",
    },
    stage: "Shipment",
    stageHistory: [
      { stage: "Proposal", at: "2026-07-18", owner: "Sales team" },
      { stage: "Onboarding", at: "2026-07-19", owner: "Ops team" },
      { stage: "PO & Advance", at: "2026-07-21", owner: "Accounts" },
      { stage: "Provisioning", at: "2026-07-23", owner: "Infra team" },
      { stage: "Data Load", at: "2026-07-24", owner: "White Glove team" },
      { stage: "Shipment", at: "2026-07-26", owner: "Logistics" },
    ],
    progress: 100,
    estimate: { min: 38000, max: 52000, ratesVersion: "2026.07" },
    contractValue: 44800,
    documents: docs(
      ["Proposal", "Rental agreement", "Service SLA", "DPA", "Chain of custody", "Invoice"],
      { "Checksum report": "Verification", "Erasure certificate": "Certified Erase" },
    ),
    payments: pay(22400, "paid", 22400, "due"),
    projectManager: "Ops team",
    complianceFlags: ["Healthcare data"],
    source_attribution: "awsmp",
  },
  {
    id: "3b8d6f21-9c4e-4a17-8f2b-1d7a9e3c5f88",
    displayId: "DD-2026-0184",
    createdAt: "2026-07-10",
    volumeTB: 320,
    availableFrom: "2026-07-14",
    moveBy: "2026-07-30",
    inPersonAssist: false,
    serviceLevel: "Self-managed",
    source: {
      kind: "Private data centre",
      location: addr("Germany", "Hesse", "Frankfurt", "Kleyerstraße 90", "60326"),
      contact: contact("Contact C", "contact.c@example.com", "+49 30 5550 0003"),
      label: "Frankfurt, DE",
    },
    destination: {
      kind: "Public cloud",
      cloudProvider: "Azure",
      cloudEndpointSupport: false,
      location: addr("Germany", "Hesse", "Frankfurt", "Rebstöcker Str. 25", "60326"),
      contact: contact("Contact C", "contact.c@example.com", "+49 30 5550 0003"),
      label: "Azure Germany West",
    },
    stage: "Data Load",
    stageHistory: [
      { stage: "Proposal", at: "2026-07-10", owner: "Sales team" },
      { stage: "Onboarding", at: "2026-07-12", owner: "Ops team" },
      { stage: "PO & Advance", at: "2026-07-14", owner: "Accounts" },
      { stage: "Provisioning", at: "2026-07-16", owner: "Infra team" },
      { stage: "Data Load", at: "2026-07-18", owner: "Customer" },
    ],
    progress: 62,
    estimate: { min: 17000, max: 23000, ratesVersion: "2026.07" },
    contractValue: 19600,
    documents: docs(
      ["Proposal", "Rental agreement", "Service SLA", "Invoice"],
      {
        "Chain of custody": "Shipment",
        "Checksum report": "Verification",
        "Erasure certificate": "Certified Erase",
      },
    ),
    payments: pay(9800, "paid", 9800, "scheduled"),
    projectManager: "Ops team",
    source_attribution: "direct",
  },
  {
    id: "c4a91e07-2f5b-4d88-b3e6-8a0f2c9d41b7",
    displayId: "DD-2026-0181",
    createdAt: "2026-07-02",
    volumeTB: 1200,
    availableFrom: "2026-08-01",
    moveBy: "2026-09-15",
    inPersonAssist: true,
    serviceLevel: "White Glove",
    source: {
      kind: "Private data centre",
      location: addr("Australia", "New South Wales", "Sydney", "639 Gardeners Rd", "2015"),
      contact: contact("Contact D", "contact.d@example.com", "+61 2 5550 0004"),
      label: "Sydney, AU",
    },
    destination: {
      kind: "Private data centre",
      location: addr("Singapore", "Central Region", "Singapore", "26A Ayer Rajah Crescent", "139963"),
      contact: contact("Contact E", "contact.e@example.com", "+65 5550 0005"),
      label: "Singapore, SG",
    },
    stage: "Provisioning",
    stageHistory: [
      { stage: "Proposal", at: "2026-07-02", owner: "Sales team" },
      { stage: "Onboarding", at: "2026-07-08", owner: "Ops team" },
      { stage: "PO & Advance", at: "2026-07-15", owner: "Accounts" },
      { stage: "Provisioning", at: "2026-07-22", owner: "Infra team" },
    ],
    progress: 0,
    estimate: { min: 54000, max: 74000, ratesVersion: "2026.07" },
    contractValue: 63500,
    documents: docs(
      ["Proposal", "Rental agreement", "Service SLA", "Invoice"],
      {
        "Chain of custody": "Shipment",
        "Checksum report": "Verification",
        "Erasure certificate": "Certified Erase",
      },
    ),
    payments: pay(31750, "paid", 31750, "scheduled"),
    projectManager: "Ops team",
    source_attribution: "direct",
  },
  {
    id: "7e5f3c19-8b26-4e91-a0d4-5f1b7c8e2a63",
    displayId: "DD-2026-0176",
    createdAt: "2026-06-24",
    volumeTB: 96,
    availableFrom: "2026-06-28",
    moveBy: "2026-07-12",
    inPersonAssist: false,
    serviceLevel: "Self-managed",
    source: {
      kind: "Public cloud",
      cloudProvider: "GCP",
      cloudEndpointSupport: true,
      location: addr("United Kingdom", "England", "London", "6 Pancras Square", "N1C 4AG"),
      contact: contact("Contact F", "contact.f@example.com", "+44 20 5550 0006"),
      label: "GCP europe-west2",
    },
    destination: {
      kind: "Private data centre",
      location: addr("United Kingdom", "England", "Manchester", "1 Hardman Blvd", "M3 3AQ"),
      contact: contact("Contact F", "contact.f@example.com", "+44 20 5550 0006"),
      label: "Manchester, GB",
    },
    stage: "Closure",
    stageHistory: [
      { stage: "Proposal", at: "2026-06-24", owner: "Sales team" },
      { stage: "Closure", at: "2026-07-12", owner: "Accounts" },
    ],
    progress: 100,
    estimate: { min: 9000, max: 12000, ratesVersion: "2026.07" },
    contractValue: 10400,
    documents: docs([
      "Proposal",
      "Rental agreement",
      "Service SLA",
      "Chain of custody",
      "Checksum report",
      "Erasure certificate",
      "Invoice",
    ]),
    payments: pay(5200, "paid", 5200, "paid"),
    projectManager: "Ops team",
    source_attribution: "awsmp",
    closed: true,
  },
  {
    id: "1a6b8d40-5c72-49e3-9f18-3b2e7a4c6d95",
    displayId: "DD-2026-0168",
    createdAt: "2026-06-12",
    volumeTB: 540,
    availableFrom: "2026-06-15",
    moveBy: "2026-07-01",
    inPersonAssist: true,
    serviceLevel: "White Glove",
    source: {
      kind: "Private data centre",
      location: addr("Japan", "Tokyo", "Tokyo", "1-9-2 Otemachi, Chiyoda", "100-0004"),
      contact: contact("Contact G", "contact.g@example.com", "+81 3 5550 0007"),
      label: "Tokyo, JP",
    },
    destination: {
      kind: "Public cloud",
      cloudProvider: "AWS",
      cloudEndpointSupport: true,
      location: addr("Japan", "Tokyo", "Tokyo", "Marunouchi 2-7-2", "100-7014"),
      contact: contact("Contact G", "contact.g@example.com", "+81 3 5550 0007"),
      label: "AWS ap-northeast-1",
    },
    stage: "Closure",
    stageHistory: [
      { stage: "Proposal", at: "2026-06-12", owner: "Sales team" },
      { stage: "Closure", at: "2026-07-01", owner: "Accounts" },
    ],
    progress: 100,
    estimate: { min: 29000, max: 39000, ratesVersion: "2026.07" },
    contractValue: 34200,
    documents: docs([
      "Proposal",
      "Rental agreement",
      "Service SLA",
      "Chain of custody",
      "Checksum report",
      "Erasure certificate",
      "Invoice",
    ]),
    payments: pay(17100, "paid", 17100, "paid"),
    projectManager: "Ops team",
    source_attribution: "direct",
    closed: true,
  },
];

export const DEMO_SUBSCRIPTIONS: DeviceSubscription[] = [
  {
    id: "SUB-1093",
    createdAt: "2026-07-05",
    items: [
      { productSlug: "bryck", model: "BRYCK", capacityTB: 512, qty: 2, monthlyRate: 0 },
      { productSlug: "bryck-mini", model: "BM-LPSL1", capacityTB: 256, qty: 1, monthlyRate: 0 },
    ],
    startDate: "2026-07-12",
    endDate: "2026-10-11",
    shipping: addr("India", "Karnataka", "Bengaluru", "Sattva Knowledge Court", "560048"),
    contact: contact("Contact A", "contact.a@example.com", "+91 90000 00001"),
    monthlyTotal: 0,
    status: "Active",
  },
  {
    id: "SUB-1087",
    createdAt: "2026-06-28",
    items: [
      { productSlug: "bryck-fxr", model: "BRYCK FXR", capacityTB: 512, qty: 1, monthlyRate: 120 },
    ],
    startDate: "2026-07-01",
    endDate: "2026-08-31",
    shipping: addr("United States", "Virginia", "Ashburn", "21715 Filigree Ct", "20147"),
    contact: contact("Contact B", "contact.b@example.com", "+1 555 010 0002"),
    monthlyTotal: 120,
    status: "Active",
  },
  {
    id: "SUB-1074",
    createdAt: "2026-05-15",
    items: [
      { productSlug: "bryck-mini", model: "BM-LPSL1", capacityTB: 256, qty: 3, monthlyRate: 0 },
    ],
    startDate: "2026-05-20",
    endDate: "2026-06-19",
    shipping: addr("Australia", "New South Wales", "Sydney", "639 Gardeners Rd", "2015"),
    contact: contact("Contact D", "contact.d@example.com", "+61 2 5550 0004"),
    monthlyTotal: 0,
    status: "Closed",
  },
];

/** Live intake sessions for the staff Conversations queue (FR-6.2). */
export const DEMO_CONVERSATIONS: ConversationSession[] = [
  {
    displayId: "DD-2026-0188",
    source: "awsmp",
    state: "estimate-shown",
    facts: {
      sizeTB: 60,
      sourceLocation: "Pune, India",
      destination: "AWS eu-west-1",
      serviceLevel: "Self-managed",
    },
    lastActiveAt: "live now",
    estimateRange: { min: 8000, max: 11000 },
    summary: { deviceLabel: "1 × BRYCK 64 TB", totalHours: 41 },
    transcript: [
      { role: "agent", text: "Hi, I'm the DataDart assistant. How much data are you moving?" },
      { role: "user", text: "About 60 TB of genomics data." },
      { role: "agent", text: "Got it, 60 TB. Where does it live today?" },
      { role: "user", text: "Our sequencing lab in Pune, India." },
      { role: "agent", text: "And where does it need to land?" },
      { role: "user", text: "S3 in eu-west-1." },
      { role: "agent", text: "One BRYCK covers this in a single trip, roughly 41 h door to door. I've put a range together below." },
    ],
  },
  {
    displayId: "DD-2026-0186",
    source: "direct",
    state: "abandoned",
    facts: {
      sizeTB: 450,
      sourceLocation: "Austin, United States",
      destination: "AWS us-west-2",
    },
    lastActiveAt: "38 min ago",
    contactEmail: "contact@northwind.example",
    company: "Northwind Media",
    estimateRange: { min: 24000, max: 33000 },
    summary: { deviceLabel: "2 × BRYCK 256 TB", totalHours: 63 },
    transcript: [
      { role: "agent", text: "Hi, I'm the DataDart assistant. How much data are you moving?" },
      { role: "user", text: "450TB of raw 8K footage" },
      { role: "agent", text: "450 TB. Where is it right now?" },
      { role: "user", text: "Post house in Austin, US" },
      { role: "agent", text: "And the destination?" },
      { role: "user", text: "us-west-2" },
      { role: "agent", text: "Two BRYCKs handle that in one run, about 63 h door to door. Where should I send the written estimate?" },
      { role: "user", text: "contact@northwind.example" },
    ],
  },
  {
    displayId: "DD-2026-0185",
    source: "partner",
    state: "contact-captured",
    facts: {
      sizeTB: 1500,
      sourceLocation: "Dubai, UAE",
      destination: "Azure UAE North",
      serviceLevel: "White Glove",
    },
    lastActiveAt: "2 h ago",
    contactEmail: "ops@gulfstream-data.example",
    company: "Gulfstream Data",
    estimateRange: { min: 79000, max: 108000 },
    summary: { deviceLabel: "2 × BRYCK 1024 TB", totalHours: 96 },
    transcript: [
      { role: "agent", text: "Hi, I'm the DataDart assistant. How much data are you moving?" },
      { role: "user", text: "1.5 PB, seismic survey archive" },
      { role: "agent", text: "1,500 TB. Where does it live today?" },
      { role: "user", text: "Our facility in Dubai, UAE" },
      { role: "agent", text: "And where does it need to land?" },
      { role: "user", text: "Azure UAE North" },
      { role: "agent", text: "At that scale most customers take White Glove, where our engineers run capture on site. Shall I price that?" },
      { role: "user", text: "Yes, white glove please. ops@gulfstream-data.example" },
      { role: "agent", text: "Done. 2 BRYCKs at 1 PB each, roughly 96 h door to door. A specialist will follow up." },
    ],
  },
];

export const DEMO_ACTIVITY: ActivityItem[] = [
  {
    id: "act-1",
    kind: "order",
    title: "DD-2026-0187 entered Shipment",
    detail: "Sealed device in transit, Bengaluru → AWS us-east-1",
    when: "2h ago",
    status: "transit",
  },
  {
    id: "act-2",
    kind: "order",
    title: "DD-2026-0184 is loading data",
    detail: "62% of 320 TB written to device",
    when: "Yesterday",
    status: "info",
  },
  {
    id: "act-3",
    kind: "system",
    title: "Chain of custody available",
    detail: "DD-2026-0187, downloadable now",
    when: "2d ago",
    status: "success",
  },
  {
    id: "act-4",
    kind: "order",
    title: "DD-2026-0181 provisioning started",
    detail: "Sydney → Singapore, window opens 01 Aug",
    when: "3d ago",
    status: "info",
  },
];

/**
 * Every ID that `/orders/[id]` must be able to serve in the static export: the
 * seeded orders, the seeded conversations (each can be converted into an order
 * that keeps its reference), and the reserved block runtime IDs are drawn from.
 */
export function orderRouteIds(): string[] {
  return [
    ...new Set([
      ...DEMO_ORDERS.map((o) => o.displayId),
      ...DEMO_CONVERSATIONS.map((c) => c.displayId),
      ...RESERVED_DISPLAY_IDS,
    ]),
  ];
}
