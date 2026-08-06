"use client";

import { useRouter } from "next/navigation";
import { KeyRound, LogOut, SlidersHorizontal, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore, useMounted } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PATHS } from "@/lib/nav";

export function UserAvatar({
  className,
  ringClassName,
}: {
  className?: string;
  ringClassName?: string;
}) {
  const profile = useAppStore((s) => s.profile);
  const mounted = useMounted();
  const initial = mounted ? (profile.firstName[0] ?? "U") : "";
  return (
    <span className={cn("relative inline-flex rounded-full p-0.5", ringClassName)}>
      {/* A conic ring that turns slowly around the initial. A flat gradient
          border reads as a sticker; a moving one reads as a live session. */}
      <span
        aria-hidden
        className="adv-orbit absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent,var(--plasma),var(--cyo),transparent)]"
      />
      <span
        className={cn(
          "relative flex size-8 items-center justify-center rounded-full bg-elev text-sm font-semibold text-ink coarse:size-10",
          className,
        )}
      >
        {initial}
      </span>
    </span>
  );
}

export function UserMenu() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const signOut = useAppStore((s) => s.signOut);
  const mounted = useMounted();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-xl">
        {/* Plain header, not a MenuGroupLabel — Base UI requires those to live
            inside a Menu.Group, and this is standalone identity chrome. */}
        <div className="flex items-center gap-3 px-2 py-3">
          <UserAvatar className="size-9" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {mounted ? `${profile.firstName} ${profile.lastName}` : ""}
            </span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {mounted ? profile.email : ""}
            </span>
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="gap-2.5 rounded-lg py-2.5"
            onClick={() => router.push("/customer/profile")}
          >
            <UserRound className="size-4" /> View &amp; Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 rounded-lg py-2.5"
            onClick={() => router.push("/customer/profile/password")}
          >
            <KeyRound className="size-4" /> Change Password
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 rounded-lg py-2.5"
            onClick={() => router.push("/")}
          >
            <SlidersHorizontal className="size-4" /> Change experience
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="gap-2.5 rounded-lg py-2.5"
          onClick={() => {
            signOut();
            toast.success("Logged out successfully!");
            router.push(PATHS.signin);
          }}
        >
          <LogOut className="size-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
