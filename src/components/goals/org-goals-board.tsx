"use client";

import Link from "next/link";

import type { GoalRecord } from "@/components/goals/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OrgGoalsBoardProps = {
  goals: GoalRecord[];
  isLoading: boolean;
};

export function OrgGoalsBoard({ goals, isLoading }: OrgGoalsBoardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-sm">
          Loading organization goals...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization priorities</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {goals.map((goal) => (
          <Link key={goal.id} href={`/goals/${goal.id}`}>
            <div className="hover:border-primary/50 h-full space-y-2 rounded-md border p-3 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{goal.title}</p>
                <Badge variant="outline">{goal.status}</Badge>
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">{goal.timebox_type}</Badge>
                <span>
                  {goal.start_date} → {goal.end_date}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {goals.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No organization goals available yet.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
