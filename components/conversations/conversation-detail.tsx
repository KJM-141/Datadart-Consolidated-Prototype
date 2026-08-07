"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock,
  FileText,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
} from "lucide-react";
import { AssistantMark } from "@/components/brand/assistant-mark";
import { Markdown } from "@/components/shared/markdown";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fmtUSD } from "@/lib/pricing";
import type { ConversationSession } from "@/lib/types";
import { cn } from "@/lib/utils";

const SOURCE_LABEL = {
  awsmp: "AWS Marketplace",
  direct: "Direct",
  partner: "Partner",
} as const;

interface Props {
  session: ConversationSession | null;
  onOpenChange: (open: boolean) => void;
  onConvert: (session: ConversationSession) => void;
  onTakeOver: (session: ConversationSession) => void;
}

/**
 * WF-6 detail panel. Staff read the transcript the customer actually saw,
 * check what the agent extracted, and act — take over, or raise the proposal.
 */
export function ConversationDetail({
  session,
  onOpenChange,
  onConvert,
  onTakeOver,
}: Props) {
  return (
    <Sheet open={!!session} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-xl"
        aria-describedby={undefined}
      >
        {session && (
          <>
            <SheetHeader className="border-b px-5 py-4 pr-14">
              <SheetTitle className="flex flex-wrap items-center gap-2 text-base font-semibold tracking-tight">
                {session.displayId}
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {SOURCE_LABEL[session.source]}
                </span>
              </SheetTitle>
              <SheetDescription>
                Last active {session.lastActiveAt}
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* what the agent extracted */}
              <section>
                <SectionLabel>Extracted facts</SectionLabel>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Fact
                    icon={Package}
                    label="Volume"
                    value={
                      session.facts.sizeTB
                        ? `${session.facts.sizeTB.toLocaleString()} TB`
                        : undefined
                    }
                  />
                  <Fact
                    icon={ShieldCheck}
                    label="Service level"
                    value={session.facts.serviceLevel}
                  />
                  <Fact
                    icon={MapPin}
                    label="Source"
                    value={session.facts.sourceLocation}
                  />
                  <Fact
                    icon={MapPin}
                    label="Destination"
                    value={session.facts.destination}
                  />
                  <Fact
                    icon={Clock}
                    label="Timeline"
                    value={session.facts.timeline}
                  />
                  <Fact
                    icon={ShieldCheck}
                    label="Compliance"
                    value={session.facts.compliance}
                  />
                </dl>
              </section>

              {/* contact */}
              {(session.contactEmail || session.company) && (
                <section>
                  <SectionLabel>Contact</SectionLabel>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Fact
                      icon={Building2}
                      label="Company"
                      value={session.company}
                    />
                    <Fact
                      icon={Mail}
                      label="Email"
                      value={session.contactEmail}
                    />
                  </dl>
                </section>
              )}

              {/* estimate */}
              {session.estimateRange && (
                <section className="rounded-2xl border bg-muted/40 p-4">
                  <SectionLabel>Estimate shown to customer</SectionLabel>
                  <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums">
                    {fmtUSD(session.estimateRange.min)} –{" "}
                    {fmtUSD(session.estimateRange.max)}
                  </p>
                  {session.summary && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {session.summary.deviceLabel} · ~
                      {session.summary.totalHours} h door to door
                    </p>
                  )}
                </section>
              )}

              {/* transcript */}
              <section>
                <SectionLabel>Transcript</SectionLabel>
                {session.transcript?.length ? (
                  <div className="mt-2 space-y-2.5">
                    {session.transcript.map((t, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex gap-2.5",
                          t.role === "user" && "flex-row-reverse",
                        )}
                      >
                        {t.role === "agent" ? (
                          <AssistantMark size={28} className="mt-0.5" />
                        ) : (
                          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                            You
                          </span>
                        )}
                        {/* A div, not a p: Markdown emits paragraphs and lists,
                            and block elements inside a <p> are invalid markup
                            that React refuses to hydrate. */}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
                            t.role === "agent"
                              ? "rounded-tl-sm bg-muted"
                              : "rounded-tr-sm bg-gradient-brand text-white",
                          )}
                        >
                          <Markdown text={t.text} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No messages captured yet — the session is still opening.
                  </p>
                )}
              </section>
            </div>

            {/* actions */}
            <div className="flex flex-wrap items-center gap-2 border-t px-5 py-4">
              {session.convertedOrderId ? (
                <>
                  <p className="flex-1 text-xs text-muted-foreground">
                    Proposal raised as{" "}
                    <span className="font-semibold text-foreground">
                      {session.convertedOrderId}
                    </span>
                  </p>
                  <Button
                    render={<Link href={`/customer/history/${session.convertedOrderId}`} />}
                    nativeButton={false}
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                  >
                    <FileText className="size-3.5" /> View order
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => onTakeOver(session)}
                  >
                    Take over chat
                  </Button>
                  <Button
                    size="sm"
                    className="btn-brand ml-auto rounded-full font-semibold"
                    onClick={() => onConvert(session)}
                  >
                    Convert to proposal <ArrowRight className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border bg-card px-3 py-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0">
        <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd
          className={cn(
            "truncate text-[13px] font-medium",
            !value && "text-muted-foreground/60",
          )}
        >
          {value ?? "Not asked yet"}
        </dd>
      </span>
    </div>
  );
}
