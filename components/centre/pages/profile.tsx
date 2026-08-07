"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { KeyRound, LogOut, Pencil, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  AddressFields,
  validateAddress,
} from "@/components/shared/address-fields";
import { Block, Label, PageHead } from "../kit";
import { PATHS } from "@/lib/nav";
import { useAppStore, useMounted } from "@/lib/store";
import type { UserProfile } from "@/lib/types";
import { bloomSoft, deckStagger } from "@/lib/advanced-motion";

/**
 * ── Profile ───────────────────────────────────────────────────────────────
 *
 * Read by default, edit in place.
 *
 * The previous version framed the identity as a credential card with a
 * rotating conic ring and docked the save controls in a floating tray at the
 * bottom of the viewport — chrome for a page that shows six fields and changes
 * about twice a year.
 *
 * Now it is two blocks and a definition list. The save bar appears inside the
 * block being edited, where the fields are, rather than floating over content
 * it is not attached to.
 */
export function ProfilePage() {
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const signOut = useAppStore((s) => s.signOut);
  const mounted = useMounted();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  if (!mounted) return null;

  const p = editing ? draft : profile;
  const valid =
    draft.firstName.trim() && draft.phone.trim() && !validateAddress(draft.address);

  const startEdit = () => {
    setDraft(profile);
    setShowErrors(false);
    setEditing(true);
  };

  const save = async () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 550));
    updateProfile(draft);
    setSaving(false);
    setEditing(false);
    toast.success("Profile updated");
  };

  return (
    <>
      <PageHead
        eyebrow="Account"
        title="My profile"
        action={
          !editing && (
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-[12.5px] font-medium text-ink-2 ring-1 ring-inset ring-hair transition-colors hover:text-ink"
            >
              <Pencil className="size-3.5" /> Edit
            </button>
          )
        }
      />

      <motion.div
        variants={deckStagger(0.05, 0.04)}
        initial="hidden"
        animate="show"
        className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]"
      >
        <motion.div variants={bloomSoft}>
          <Block
            icon={UserRound}
            label="Identity"
            action={
              editing && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  aria-label="Cancel editing"
                  className="grid size-6 place-items-center rounded text-ink-3 transition-colors hover:text-ink"
                >
                  <X className="size-3.5" />
                </button>
              )
            }
          >
            {editing ? (
              <div className="space-y-3 px-4 py-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5">First name</Label>
                    <Input
                      value={draft.firstName}
                      onChange={(e) =>
                        setDraft({ ...draft, firstName: e.target.value })
                      }
                      aria-label="First name"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5">Last name</Label>
                    <Input
                      value={draft.lastName}
                      onChange={(e) =>
                        setDraft({ ...draft, lastName: e.target.value })
                      }
                      aria-label="Last name"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5">Phone</Label>
                    <Input
                      value={draft.phone}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                      aria-label="Phone"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5">Email</Label>
                    <Input value={draft.email} disabled aria-label="Email" />
                  </div>
                </div>

                <div className="border-t border-hair pt-3">
                  <Label className="mb-2">Address</Label>
                  <AddressFields
                    value={draft.address}
                    onChange={(address) => setDraft({ ...draft, address })}
                    errors={showErrors ? (validateAddress(draft.address) ?? undefined) : undefined}
                  />
                </div>

                {/* Attached to the fields, not floating over the page. */}
                <div className="flex items-center gap-2 border-t border-hair pt-3">
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="btn-plasma inline-flex h-9 items-center px-4 text-[12.5px] font-medium text-white disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="text-[12.5px] text-ink-3 transition-colors hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <dl className="divide-y divide-hair">
                <Row k="Name" v={`${p.firstName} ${p.lastName}`.trim() || "—"} />
                <Row k="Email" v={p.email || "—"} />
                <Row k="Phone" v={p.phone || "—"} />
                <Row
                  k="Address"
                  v={
                    [
                      p.address.address,
                      p.address.city,
                      p.address.state,
                      p.address.pincode,
                      p.address.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
              </dl>
            )}
          </Block>
        </motion.div>

        <motion.div variants={bloomSoft}>
          <Block icon={KeyRound} label="Security">
            <ul className="divide-y divide-hair">
              <li>
                <Link
                  href={PATHS.changePassword}
                  className="flex items-center gap-2.5 px-4 py-3 text-[12.5px] transition-colors hover:bg-sunk"
                >
                  <KeyRound className="size-3.5 text-ink-3" />
                  Change password
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    toast.success("Signed out");
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[12.5px] text-ink-2 transition-colors hover:bg-sunk hover:text-destructive"
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </button>
              </li>
            </ul>
          </Block>
        </motion.div>
      </motion.div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4 px-4 py-2.5">
      <dt className="w-24 shrink-0 text-[11.5px] text-ink-3">{k}</dt>
      <dd className="flex-1 text-[12.5px] leading-relaxed">{v}</dd>
    </div>
  );
}
