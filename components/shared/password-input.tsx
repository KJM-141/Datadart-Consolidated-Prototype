"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PasswordInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      {/* Grid-centred so the hit area can grow to 44px on touch without the
          icon drifting off the input's vertical centre. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground coarse:size-11"
      >
        {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>
    </div>
  );
});
