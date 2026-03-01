"use client";

import Link from "next/link";

import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GoalsShellProps = {
  activeTab: "my" | "org" | "team";
  onCreateGoal: (payload: {
    scopeType: "org" | "team" | "user";
    title: string;
    timeboxType: "annual" | "quarterly" | "monthly" | "weekly" | "custom";
    startDate: string;
    endDate: string;
    visibility: "org" | "team" | "private";
  }) => Promise<unknown> | void;
  children: React.ReactNode;
};

const TABS = [
  { key: "my", label: "My Goals", href: "/goals/my" },
  { key: "org", label: "Org Goals", href: "/goals/org" },
  { key: "team", label: "Team Goals", href: "/goals/team" },
] as const;

export function GoalsShell({
  activeTab,
  onCreateGoal,
  children,
}: GoalsShellProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <Button
              key={tab.key}
              asChild
              size="sm"
              variant={activeTab === tab.key ? "default" : "outline"}
              className={cn(activeTab === tab.key ? "shadow-sm" : "")}
            >
              <Link href={tab.href}>{tab.label}</Link>
            </Button>
          ))}
        </div>
        <GoalFormDialog
          defaultScope={
            activeTab === "my" ? "user" : activeTab === "team" ? "team" : "org"
          }
          onSubmit={onCreateGoal}
        />
      </div>
      {children}
    </div>
  );
}
