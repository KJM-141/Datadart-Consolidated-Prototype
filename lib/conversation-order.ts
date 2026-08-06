import { addDays, format } from "date-fns";
import { estimate } from "./pricing";
import type {
  Address,
  ConversationSession,
  ContactPerson,
  EndpointDetails,
  TransferOrder,
  UserProfile,
} from "./types";

const CLOUDS = ["AWS", "Azure", "GCP", "IBM Cloud", "OCI"] as const;

const BLANK_ADDRESS: Address = {
  address: "",
  country: "",
  state: "",
  city: "",
  pincode: "",
};

/**
 * The agent only ever captures a free-text place ("Pune, India", "AWS —
 * eu-west-1"). Sales fills in the real address at Onboarding, so we keep the
 * label the customer used and leave the structured fields blank rather than
 * inventing an address that would later have to be unpicked.
 */
function endpointFromLabel(
  label: string | undefined,
  contact: ContactPerson,
): EndpointDetails {
  const text = label?.trim() || "To be confirmed";
  const cloud = CLOUDS.find((c) => text.toLowerCase().startsWith(c.toLowerCase()));
  const [city = "", country = ""] = cloud ? [] : text.split(",").map((p) => p.trim());

  return {
    kind: cloud ? "Public cloud" : "Private data centre",
    cloudProvider: cloud,
    cloudEndpointSupport: cloud ? true : undefined,
    location: { ...BLANK_ADDRESS, city, country },
    contact,
    label: text,
  };
}

/**
 * Turns a completed intake session into a draft order parked at stage
 * "Proposal" (FR-6.2). Everything the agent learned carries over; everything
 * it never asked about is left empty for sales to complete.
 */
export function orderFromConversation(
  session: ConversationSession,
  profile: UserProfile,
): TransferOrder {
  const { facts } = session;
  const sizeTB = facts.sizeTB ?? 0;
  const serviceLevel = facts.serviceLevel ?? "Self-managed";
  const today = new Date();

  const contact: ContactPerson = {
    name: session.company ?? `${profile.firstName} ${profile.lastName}`,
    email: session.contactEmail ?? profile.email,
    phone: profile.phone,
  };

  // Prefer the range the customer was actually shown; re-price only if the
  // session never reached an estimate.
  const priced = estimate({ sizeTB, serviceLevel });
  const quote = session.estimateRange ?? { min: priced.min, max: priced.max };

  return {
    id: crypto.randomUUID(),
    // The reference the customer already has from the chat carries through to
    // the order, so a draft and its proposal are never two numbers to track.
    displayId: session.displayId,
    createdAt: format(today, "yyyy-MM-dd"),
    volumeTB: sizeTB,
    availableFrom: format(addDays(today, 7), "yyyy-MM-dd"),
    moveBy: format(addDays(today, 30), "yyyy-MM-dd"),
    inPersonAssist: serviceLevel === "White Glove",
    serviceLevel,
    source: endpointFromLabel(facts.sourceLocation, contact),
    destination: endpointFromLabel(facts.destination, contact),
    stage: "Proposal",
    stageHistory: [
      {
        stage: "Proposal",
        at: format(today, "yyyy-MM-dd"),
        owner: `Converted from ${session.displayId}`,
      },
    ],
    progress: 0,
    estimate: {
      min: quote.min,
      max: quote.max,
      ratesVersion: priced.ratesVersion,
    },
    documents: [
      { type: "Proposal", status: "pending", availableAtStage: "Proposal" },
      { type: "Rental agreement", status: "pending", availableAtStage: "Onboarding" },
      { type: "Chain of custody", status: "pending", availableAtStage: "Shipment" },
      { type: "Checksum report", status: "pending", availableAtStage: "Verification" },
      {
        type: "Erasure certificate",
        status: "pending",
        availableAtStage: "Certified Erase",
      },
    ],
    payments: [
      { label: "Advance (50%)", amount: Math.round(quote.min / 2), status: "scheduled" },
      {
        label: "Balance (50%)",
        amount: Math.round(quote.min / 2),
        status: "scheduled",
        dueAtStage: "Verification",
      },
    ],
    complianceFlags: facts.compliance ? [facts.compliance] : undefined,
    source_attribution: session.source,
  };
}
