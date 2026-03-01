"use client";

import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

function toTitle(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "today";
  return segment
    .replace("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AppTopbar() {
  const pathname = usePathname();

  return (
    <header className="bg-background sticky top-0 z-10 flex h-16 items-center gap-3 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-1 h-4" />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <h1 className="truncate text-base font-semibold">
          {toTitle(pathname)}
        </h1>
        <Badge variant="outline" className="hidden sm:inline-flex">
          Lead measures first
        </Badge>
      </div>

      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="size-4" />
      </Button>
      <ThemeToggle />
    </header>
  );
}
