"use client";

import { Input } from "@/components/ui/input";
import { Field } from "./field";
import type { ContactPerson } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ContactFieldsProps {
  value: ContactPerson;
  onChange: (value: ContactPerson) => void;
  errors?: Partial<Record<keyof ContactPerson, string>>;
  idPrefix?: string;
  className?: string;
}

/** Contact person block — Name*, Mail Id*, Phone Number* — reused across wizards. */
export function ContactFields({
  value,
  onChange,
  errors,
  idPrefix = "contact",
  className,
}: ContactFieldsProps) {
  const set = (patch: Partial<ContactPerson>) =>
    onChange({ ...value, ...patch });

  return (
    <div className={cn("grid gap-4 sm:grid-cols-3", className)}>
      <Field
        label="Name"
        required
        htmlFor={`${idPrefix}-name`}
        error={errors?.name}
      >
        <Input
          id={`${idPrefix}-name`}
          value={value.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Full name"
          autoComplete="name"
        />
      </Field>
      <Field
        label="Mail Id"
        required
        htmlFor={`${idPrefix}-email`}
        error={errors?.email}
      >
        <Input
          id={`${idPrefix}-email`}
          type="email"
          value={value.email}
          onChange={(e) => set({ email: e.target.value })}
          placeholder="name@company.com"
          autoComplete="email"
        />
      </Field>
      <Field
        label="Phone Number"
        required
        htmlFor={`${idPrefix}-phone`}
        error={errors?.phone}
      >
        <Input
          id={`${idPrefix}-phone`}
          type="tel"
          value={value.phone}
          onChange={(e) => set({ phone: e.target.value })}
          placeholder="+91 98xxxxxx"
          autoComplete="tel"
        />
      </Field>
    </div>
  );
}

export const emptyContact = (): ContactPerson => ({
  name: "",
  email: "",
  phone: "",
});

export function validateContact(
  c: ContactPerson,
): Partial<Record<keyof ContactPerson, string>> | null {
  const errors: Partial<Record<keyof ContactPerson, string>> = {};
  if (!c.name.trim()) errors.name = "Name is required";
  if (!/^\S+@\S+\.\S+$/.test(c.email)) errors.email = "Valid email required";
  if (!c.phone.trim()) errors.phone = "Phone number is required";
  return Object.keys(errors).length ? errors : null;
}
