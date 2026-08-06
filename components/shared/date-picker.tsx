"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "justify-start gap-2 rounded-lg font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-4" />
        {value ? format(value, "dd MMM, yyyy") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
          disabled={disabled}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range?: DateRange) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  className,
}: DateRangePickerProps) {
  const label =
    value?.from && value?.to
      ? `${format(value.from, "dd MMM, yy")} – ${format(value.to, "dd MMM, yy")}`
      : value?.from
        ? `${format(value.from, "dd MMM, yy")} – …`
        : placeholder;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "justify-start gap-2 rounded-lg font-normal",
              !value?.from && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-4" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
