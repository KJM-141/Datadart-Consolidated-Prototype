"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The one permanent control on the centre.
 *
 * Enter sends, Shift+Enter breaks a line, the field grows with the text to a
 * ceiling and then scrolls itself. "/" or ⌘K from anywhere on the screen jumps
 * into it, which is what makes the interface chat-first rather than
 * chat-shaped: the fastest thing to reach is always the sentence, never a
 * button.
 */
const MAX_HEIGHT = 168;

export function Composer({
  onSend,
  disabled = false,
  autoFocus = false,
  placeholder = "Ask about your transfers, or say what you need moved",
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    setValue("");
    onSend(text);
  };

  return (
    <div
      onClick={() => ref.current?.focus()}
      className={cn(
        "flex items-end gap-2 rounded-2xl bg-elev/80 p-2 pl-4 backdrop-blur-sm",
        "shadow-[inset_0_0_0_1px_var(--hair)] transition-shadow duration-300",
        "focus-within:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_52%,transparent),0_0_28px_-14px_color-mix(in_oklab,var(--plasma)_95%,transparent)]",
      )}
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        aria-label="Message the DataDart assistant"
        className="min-h-9 flex-1 resize-none bg-transparent py-2 text-[13.5px] leading-relaxed outline-none placeholder:text-ink-3"
      />

      <button
        type="button"
        onClick={submit}
        disabled={!value.trim() || disabled}
        aria-label="Send"
        className="btn-plasma mb-0.5 grid size-8 shrink-0 place-items-center rounded-full text-white transition-opacity disabled:pointer-events-none disabled:opacity-35 coarse:size-11"
      >
        <ArrowUp className="size-4" />
      </button>
    </div>
  );
}
