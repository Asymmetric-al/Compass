"use client";

import Link from "next/link";

import type { GoalRecord } from "@/components/goals/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MyGoalsBoardProps = {
  goals: GoalRecord[];
  isLoading: boolean;
};

const TIMEBOX_ORDER: GoalRecord["timebox_type"][] = [
  "annual",
  "quarterly",
  "monthly",
  "weekly",
  "custom",
];

export function MyGoalsBoard({ goals, isLoading }: MyGoalsBoardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-sm">
          Loading personal goals...
        </CardContent>
      </Card>
    );
  }

  const grouped = TIMEBOX_ORDER.map((timebox) => ({
    timebox,
    items: goals.filter((goal) => goal.timebox_type === timebox),
  }));

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <Card key={group.timebox}>
          <CardHeader>
            <CardTitle className="text-base capitalize">
              {group.timebox} goals
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {group.items.map((goal) => (
              <Link key={goal.id} href={`/goals/${goal.id}`}>
                <div className="hover:border-primary/50 h-full space-y-2 rounded-md border p-3 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{goal.title}</p>
                    <Badge variant="outline">{goal.status}</Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {goal.start_date} → {goal.end_date}
                  </p>
                </div>
              </Link>
            ))}
            {group.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No {group.timebox} goals yet.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
