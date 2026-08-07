export type ProductCategory = "BRYCK" | "BRYCK Mini" | "BRYCK FXR";

/** Product line, mirroring tsecond.ai's own IA. */
export type ProductFamily = "Edge Storage" | "Edge HPC";

export interface SpecGroup {
  title: string;
  rows: { label: string; value: string }[];
}

/** Stock position, shown as a dot and one line — never a filled badge. */
export interface Availability {
  state: "available" | "limited";
  /** Six words at most: "4 ready now", "Ships in 5 days". */
  headline: string;
  detail: string;
}

export interface Product {
  slug: string;
  category: ProductCategory;
  family: ProductFamily;
  model: string;
  name: string;
  tagline: string;
  image: string;
  /** Every render of this product, primary first. Drives the detail gallery. */
  gallery: string[];
  /** The one figure worth putting next to the name. */
  hero: { value: string; label: string };
  availability: Availability;
  /** Aspect hint so cards can frame very different photo shapes nicely */
  imageAspect: "wide" | "tall" | "square";
  /** Backdrop tone the render was shot on — dark studio shots need a dark
   *  stage or they read as a black box on the light lightbox. */
  stageTone?: "light" | "dark";
  monthlyCost: number;
  priceNote?: "from";
  capacities?: number[]; // in TB
  chips: string[];
  keySpecs: { icon: string; label: string; value: string }[];
  specs: SpecGroup[];
  capabilities: string;
  detailsUrl?: string;
}


export type LocationKind = "Private data centre" | "Public cloud";
export type CloudProvider = "AWS" | "Azure" | "GCP" | "IBM Cloud" | "OCI";

export interface Address {
  address: string;
  area?: string;
  landmark?: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
}

export interface ContactPerson {
  name: string;
  email: string;
  phone: string;
}

export interface EndpointDetails {
  kind: LocationKind;
  cloudProvider?: CloudProvider;
  cloudEndpointSupport?: boolean;
  location: Address;
  contact: ContactPerson;
  /** Short display label, e.g. "Bengaluru, IN" or "AWS · us-east-1" */
  label: string;
}

export interface EnvironmentDetails {
  rackSpace: string;
  networkInterface: string;
  nicPortAvailable: string;
  networkPorts: string;
  pcieAvailable: string;
  rdmaAvailable: string;
}

/** Artifacts surfaced on the order's Documents tab (FR-4.3). */
export type DocumentType =
  | "Proposal"
  | "Rental agreement"
  | "Service SLA"
  | "DPA"
  | "Chain of custody"
  | "Checksum report"
  | "Erasure certificate"
  | "Invoice";

export interface OrderDocument {
  type: DocumentType;
  /** Available the moment it is produced; otherwise shows when it will appear. */
  status: "available" | "pending" | "signed";
  producedAt?: string;
  availableAtStage?: import("./lifecycle").Stage;
}

export interface PaymentMilestone {
  label: string;
  amount: number;
  status: "paid" | "due" | "scheduled";
  dueAtStage?: import("./lifecycle").Stage;
}

export interface StageEvent {
  stage: import("./lifecycle").Stage;
  at: string;
  owner: string;
}

export interface TransferOrder {
  /** Internal UUID — never shown; available behind a copy action (FR-6.4). */
  id: string;
  /** DD-YYYY-NNNN — the only ID users see. */
  displayId: string;
  createdAt: string;
  volumeTB: number;
  availableFrom: string;
  moveBy: string;
  inPersonAssist: boolean;
  serviceLevel: "Self-managed" | "White Glove";
  source: EndpointDetails;
  destination: EndpointDetails;
  sourceEnv?: EnvironmentDetails;
  destinationEnv?: EnvironmentDetails;
  /** Ten-stage lifecycle position (FR-4.1). */
  stage: import("./lifecycle").Stage;
  stageHistory: StageEvent[];
  /** Live copy progress from the BRYCK integration, shown at Data Load. */
  progress: number;
  estimate?: { min: number; max: number; ratesVersion: string };
  contractValue?: number;
  documents: OrderDocument[];
  payments: PaymentMilestone[];
  projectManager?: string;
  complianceFlags?: string[];
  /** Entry-point attribution for funnel analytics (FR-1.8). */
  source_attribution?: "awsmp" | "direct" | "partner";
  closed?: boolean;
}

/* ── Conversational intake (WF-1) ─────────────────────────────────────── */

export interface TransferFacts {
  sizeTB?: number;
  sourceType?: string;
  sourceLocation?: string;
  destination?: string;
  timeline?: string;
  serviceLevel?: "Self-managed" | "White Glove";
  compliance?: string;
}

export interface ChatTurn {
  id: string;
  role: "agent" | "user";
  text: string;
  /** Quick-reply chips offered with an agent turn (FR-1.2). */
  chips?: string[];
  /** Renders the estimate card inline in the transcript. */
  estimate?: boolean;
  at: number;
}

export interface ConversationSession {
  displayId: string;
  source: "awsmp" | "direct" | "partner";
  state: "active" | "estimate-shown" | "contact-captured" | "abandoned";
  facts: TransferFacts;
  lastActiveAt: string;
  contactEmail?: string;
  company?: string;
  estimateRange?: { min: number; max: number };
  /** Redacted transcript, so staff can read the session before taking over. */
  transcript?: { role: "agent" | "user"; text: string }[];
  /** Set once a proposal has been raised from this session. */
  convertedOrderId?: string;
  /** Fleet/timeline summary carried from the sizing engine. */
  summary?: { deviceLabel: string; totalHours: number };
}

export type SubscriptionStatus = "Active" | "Processing" | "Closed";

export interface SubscriptionItem {
  productSlug: string;
  model: string;
  capacityTB?: number;
  qty: number;
  monthlyRate: number;
}

export interface DeviceSubscription {
  id: string;
  createdAt: string;
  items: SubscriptionItem[];
  startDate: string;
  endDate: string;
  shipping: Address;
  contact: ContactPerson;
  monthlyTotal: number;
  status: SubscriptionStatus;
}

export interface CartItem {
  productSlug: string;
  model: string;
  detail: string;
  capacityTB?: number;
  qty: number;
  monthlyRate: number;
  image: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  address: Address;
}

export interface ActivityItem {
  id: string;
  kind: "order" | "subscription" | "cart" | "system";
  title: string;
  detail: string;
  when: string;
  status?: "info" | "success" | "transit" | "warning";
}
