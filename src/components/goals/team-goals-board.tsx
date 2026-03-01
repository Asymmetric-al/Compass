"use client";

import Link from "next/link";

import type { GoalRecord } from "@/components/goals/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TeamGoalsBoardProps = {
  goals: GoalRecord[];
  isLoading: boolean;
};

export function TeamGoalsBoard({ goals, isLoading }: TeamGoalsBoardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-sm">
          Loading team goals...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team outcomes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.map((goal) => (
          <Link key={goal.id} href={`/goals/${goal.id}`}>
            <div className="hover:border-primary/50 space-y-2 rounded-md border p-3 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{goal.title}</p>
                <Badge variant="outline">{goal.status}</Badge>
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                {goal.scope_team_id ? (
                  <Badge variant="secondary">{goal.scope_team_id}</Badge>
                ) : null}
                <Badge variant="outline">{goal.timebox_type}</Badge>
                <span>
                  {goal.start_date} → {goal.end_date}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {goals.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No team goals available yet.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
