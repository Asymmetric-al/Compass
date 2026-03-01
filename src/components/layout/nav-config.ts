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

export type AppNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const PRIMARY_NAV_ITEMS: AppNavItem[] = [
  { title: "Workboard", href: "/workboard", icon: Compass },
  { title: "Today", href: "/today", icon: ListChecks },
  { title: "My Work", href: "/my-work", icon: ListChecks },
  { title: "My Team", href: "/my-team", icon: Users },
  { title: "Network", href: "/network", icon: Network },
  { title: "Goals", href: "/goals", icon: Goal },
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
