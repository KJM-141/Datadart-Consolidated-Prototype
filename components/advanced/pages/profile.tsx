"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  AddressFields,
  validateAddress,
} from "@/components/shared/address-fields";
import { HoloPanel, PanelHead } from "@/components/advanced/kit/holo-panel";
import { HudField, hudInputClass } from "@/components/advanced/kit/hud-field";
import { HudLabel, PageHeading, Pill } from "@/components/advanced/kit/hud";
import { DeckAvatar } from "@/components/console/top-bar";
import { useAppStore, useMounted } from "@/lib/store";
import type { UserProfile } from "@/lib/types";
import { bloomSoft, deckStagger } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * Profile — the Advanced identity console.
 *
 * Same edit/cancel/save cycle, the same validation and the same shared
 * `AddressFields`. The header becomes an identity credential with a rotating
 * conic ring, and the save bar docks as a floating holo tray.
 */
export function ProfileAdvanced() {
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const mounted = useMounted();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  if (!mounted) return null;

  const startEdit = () => {
    setDraft(profile);
    setShowErrors(false);
    setEditing(true);
  };

  const valid =
    draft.firstName.trim() &&
    draft.phone.trim() &&
    !validateAddress(draft.address);

  const save = async () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 650));
    updateProfile(draft);
    setSaving(false);
    setEditing(false);
    toast.success("Profile updated successfully!");
  };

  const p = editing ? draft : profile;

  return (
    <motion.div
      variants={deckStagger(0.06)}
      initial="hidden"
      animate="show"
      className="space-y-5 pb-24"
    >
      <PageHeading
        eyebrow="Account"
        title="My profile"
        actions={
          !editing && (
            <>
              <Link
                href="/customer/profile/password"
                className="btn-ghost-hud inline-flex h-11 items-center gap-2 px-5 text-[13px] font-medium"
              >
                <KeyRound className="size-4" /> Password
              </Link>
              <button
                type="button"
                onClick={startEdit}
                className="btn-plasma inline-flex h-11 items-center gap-2 px-5 text-[13px] font-medium"
              >
                <PencilLine className="size-4" /> Edit profile
              </button>
            </>
          )
        }
      />

      {/* identity credential */}
      <motion.div variants={bloomSoft}>
        <HoloPanel plain brackets sheen className="overflow-hidden p-6">
          <span aria-hidden className="sheen" />
          <span aria-hidden className="hud-dots absolute inset-0 opacity-25" />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-28 size-64 rounded-full plasma-fill opacity-12 blur-3xl"
          />
          <div className="relative flex flex-wrap items-center gap-5">
            <DeckAvatar size={68} />
            <div className="min-w-0 flex-1">
              <HudLabel>Workspace identity</HudLabel>
              <h2 className="mt-1.5 text-[1.6rem] font-semibold leading-tight tracking-tight">
                {profile.firstName} {profile.lastName}
              </h2>
              <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5 text-(--plasma)" /> {profile.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5 text-(--ion)" />{" "}
                  {profile.countryCode} {profile.phone}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-(--cyo)" />{" "}
                  {profile.address.city}, {profile.address.country}
                </span>
              </div>
            </div>
            <Pill tone="success" icon={ShieldCheck} className="shrink-0">
              Verified
            </Pill>
          </div>
        </HoloPanel>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* contact */}
        <motion.div variants={bloomSoft}>
          <HoloPanel className="h-full p-6">
            <PanelHead label="Details" title="Contact information" />
            <div className="mt-5">
              {editing ? (
                <div className="grid gap-x-4 sm:grid-cols-2">
                  <HudField
                    label="First name"
                    required
                    htmlFor="pf-first"
                    error={
                      showErrors && !draft.firstName.trim()
                        ? "First name is required"
                        : undefined
                    }
                  >
                    <Input
                      id="pf-first"
                      value={draft.firstName}
                      onChange={(e) =>
                        setDraft({ ...draft, firstName: e.target.value })
                      }
                      className={cn(hudInputClass, "pl-4")}
                    />
                  </HudField>
                  <HudField label="Last name" htmlFor="pf-last">
                    <Input
                      id="pf-last"
                      value={draft.lastName}
                      onChange={(e) =>
                        setDraft({ ...draft, lastName: e.target.value })
                      }
                      className={cn(hudInputClass, "pl-4")}
                    />
                  </HudField>
                  <HudField
                    label="Email"
                    htmlFor="pf-email"
                    hint="Email can't be changed."
                    className="sm:col-span-2"
                  >
                    <Input
                      id="pf-email"
                      value={draft.email}
                      disabled
                      readOnly
                      className={cn(hudInputClass, "pl-4 opacity-60")}
                    />
                  </HudField>
                  <HudField
                    label="Contact number"
                    required
                    htmlFor="pf-phone"
                    className="sm:col-span-2"
                    error={
                      showErrors && !draft.phone.trim()
                        ? "Contact number is required"
                        : undefined
                    }
                  >
                    <div className="flex gap-2">
                      <span className="flex h-12 shrink-0 items-center rounded-xl bg-[color-mix(in_oklab,var(--muted)_65%,transparent)] px-3.5 text-sm font-medium text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]">
                        {draft.countryCode || "+—"}
                      </span>
                      <Input
                        id="pf-phone"
                        type="tel"
                        value={draft.phone}
                        onChange={(e) =>
                          setDraft({ ...draft, phone: e.target.value })
                        }
                        className={cn(hudInputClass, "flex-1 pl-4")}
                      />
                    </div>
                  </HudField>
                </div>
              ) : (
                <dl className="space-y-3.5">
                  <Row label="First name" value={p.firstName} />
                  <Row label="Last name" value={p.lastName || "—"} />
                  <Row label="Email" value={p.email} />
                  <Row
                    label="Contact number"
                    value={`${p.countryCode} ${p.phone}`}
                  />
                </dl>
              )}
            </div>
          </HoloPanel>
        </motion.div>

        {/* address */}
        <motion.div variants={bloomSoft}>
          <HoloPanel className="h-full p-6">
            <PanelHead label="Location" title="Address information" />
            <div className="mt-5">
              {editing ? (
                <AddressFields
                  value={draft.address}
                  onChange={(address) => setDraft({ ...draft, address })}
                  errors={
                    showErrors
                      ? (validateAddress(draft.address) ?? undefined)
                      : undefined
                  }
                  idPrefix="pf-addr"
                />
              ) : (
                <dl className="space-y-3.5">
                  <Row label="Address" value={p.address.address} />
                  <Row label="Area" value={p.address.area || "—"} />
                  <Row label="Landmark" value={p.address.landmark || "—"} />
                  <Row
                    label="Location"
                    value={`${p.address.city}, ${p.address.state}, ${p.address.country}`}
                  />
                  <Row label="Pincode/Zipcode" value={p.address.pincode} />
                </dl>
              )}
            </div>
          </HoloPanel>
        </motion.div>
      </div>

      {/* docked save tray */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-4 sm:pb-4"
          >
            <div className="holo mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl px-4 py-3 sm:px-5">
              <p className="hidden items-center gap-2 text-[13px] font-medium text-muted-foreground sm:flex">
                <span className="size-1.5 rounded-full bg-warning pulse-stage" />
                Unsaved profile changes
              </p>
              <div className="flex w-full justify-end gap-3 sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setShowErrors(false);
                  }}
                  className="btn-ghost-hud inline-flex h-11 items-center px-6 text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="btn-plasma inline-flex h-11 items-center gap-2 px-7 text-[13px] font-medium disabled:pointer-events-none disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] items-baseline gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0">
      <dt className="text-[13px] font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="text-[13px] font-medium wrap-break-word">{value}</dd>
    </div>
  );
}
