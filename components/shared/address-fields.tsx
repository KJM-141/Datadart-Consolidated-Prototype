"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Field } from "./field";
import { COUNTRIES, citiesOf, statesOf } from "@/lib/geo";
import type { Address } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AddressFieldsProps {
  value: Address;
  onChange: (value: Address) => void;
  errors?: Partial<Record<keyof Address, string>>;
  idPrefix?: string;
  /** Hide the Country select when it was already chosen upstream (signup step 1). */
  hideCountry?: boolean;
  className?: string;
}

/**
 * The portal's reusable address block — Address*, Area, Landmark, cascading
 * Country* → State* → City*, Pincode/Zipcode* — used across signup, order
 * wizard, checkout and profile.
 */
export function AddressFields({
  value,
  onChange,
  errors,
  idPrefix = "addr",
  hideCountry = false,
  className,
}: AddressFieldsProps) {
  const states = value.country ? statesOf(value.country) : [];
  const cities =
    value.country && value.state ? citiesOf(value.country, value.state) : [];

  const set = (patch: Partial<Address>) => onChange({ ...value, ...patch });

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      <Field
        label="Address"
        required
        htmlFor={`${idPrefix}-address`}
        error={errors?.address}
        className="sm:col-span-2"
      >
        <Input
          id={`${idPrefix}-address`}
          value={value.address}
          onChange={(e) => set({ address: e.target.value })}
          placeholder="Building, street"
          autoComplete="street-address"
        />
      </Field>

      <Field label="Area" htmlFor={`${idPrefix}-area`}>
        <Input
          id={`${idPrefix}-area`}
          value={value.area ?? ""}
          onChange={(e) => set({ area: e.target.value })}
          placeholder="Area / locality"
        />
      </Field>

      <Field label="Landmark" htmlFor={`${idPrefix}-landmark`}>
        <Input
          id={`${idPrefix}-landmark`}
          value={value.landmark ?? ""}
          onChange={(e) => set({ landmark: e.target.value })}
          placeholder="Nearby landmark"
        />
      </Field>

      {!hideCountry && (
        <Field label="Country" required error={errors?.country}>
          <Select
            value={value.country || null}
            onValueChange={(country) =>
              set({ country: country ?? "", state: "", city: "" })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      <Field label="State" required error={errors?.state}>
        <Select
          value={value.state || null}
          onValueChange={(state) => set({ state: state ?? "", city: "" })}
          disabled={!value.country}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={value.country ? "Select state" : "Choose country first"}
            />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {states.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="City" required error={errors?.city}>
        <Select
          value={value.city || null}
          onValueChange={(city) => set({ city: city ?? "" })}
          disabled={!value.state}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={value.state ? "Select city" : "Choose state first"}
            />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label="Pincode/Zipcode"
        required
        htmlFor={`${idPrefix}-pincode`}
        error={errors?.pincode}
      >
        <Input
          id={`${idPrefix}-pincode`}
          value={value.pincode}
          onChange={(e) => set({ pincode: e.target.value })}
          placeholder="e.g. 560048"
          autoComplete="postal-code"
        />
      </Field>
    </div>
  );
}

export const emptyAddress = (): Address => ({
  address: "",
  area: "",
  landmark: "",
  country: "",
  state: "",
  city: "",
  pincode: "",
});

/**
 * One-line address for display. Skips the parts that are blank rather than
 * emitting their separators — an order raised from an agent run or a chat knows
 * the city and country but no street, and a hardcoded `a, b, c — d` renders
 * that as ", Bengaluru, India — ".
 */
export function formatAddressLine(a: Address): string {
  const line = [a.address, a.area, a.city, a.state, a.country]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
  return a.pincode?.trim() ? `${line} — ${a.pincode.trim()}` : line;
}

export function validateAddress(
  a: Address,
): Partial<Record<keyof Address, string>> | null {
  const errors: Partial<Record<keyof Address, string>> = {};
  if (!a.address.trim()) errors.address = "Address is required";
  if (!a.country) errors.country = "Country is required";
  if (!a.state) errors.state = "State is required";
  if (!a.city) errors.city = "City is required";
  if (!a.pincode.trim()) errors.pincode = "Pincode/Zipcode is required";
  return Object.keys(errors).length ? errors : null;
}
