"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const dark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn("rounded-full", className)}
    >
      <motion.span
        key={dark ? "moon" : "sun"}
        initial={{ rotate: -60, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="flex"
      >
        {dark ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
      </motion.span>
    </Button>
  );
}
