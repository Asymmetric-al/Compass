import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  Compass,
  Cross,
  Flag,
  Goal,
  HandHelping,
  HeartHandshake,
  LayoutGrid,
  ListChecks,
  Network,
  NotebookPen,
  Shield,
  Users,
} from "lucide-react";

import { isGoalsWorkboardV2Enabled } from "@/lib/feature-flags";

export type AppNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const goalsWorkboardV2Enabled = isGoalsWorkboardV2Enabled();

export const PRIMARY_NAV_ITEMS: AppNavItem[] = [
  ...(goalsWorkboardV2Enabled
    ? [
        { title: "Workboard", href: "/workboard", icon: Compass },
        { title: "Today", href: "/today", icon: ListChecks },
      ]
    : [{ title: "Today", href: "/today", icon: Compass }]),
  { title: "My Work", href: "/my-work", icon: ListChecks },
  { title: "My Team", href: "/my-team", icon: Users },
  { title: "Network", href: "/network", icon: Network },
  {
    title: goalsWorkboardV2Enabled ? "Goals" : "Aims",
    href: goalsWorkboardV2Enabled ? "/goals" : "/aims",
    icon: Goal,
  },
  { title: "Connections", href: "/map", icon: Flag },
  { title: "Check-ins", href: "/check-ins", icon: NotebookPen },
  { title: "Stories", href: "/stories", icon: BookOpenText },
  { title: "Prayer", href: "/prayer", icon: Cross },
  { title: "Missionaries", href: "/missionaries", icon: HeartHandshake },
];

export const ADMIN_NAV_ITEMS: AppNavItem[] = [
  { title: "Admin", href: "/admin", icon: LayoutGrid },
  { title: "Security", href: "/admin/security", icon: Shield },
  { title: "Stewardship Export", href: "/admin/exports", icon: HandHelping },
];
