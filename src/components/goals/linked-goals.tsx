"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import type { GoalRecord } from "@/components/goals/types";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api/client";

type LinkedGoal = {
  goal_id: string;
  upstream_goal_id: string;
  link_type: "supports" | "related";
};

type LinkedGoalsProps = {
  goalId: string;
};

export function LinkedGoals({ goalId }: LinkedGoalsProps) {
  const linksQuery = useQuery({
    queryKey: ["goal-links", goalId],
    queryFn: async () => {
      const payload = await fetchApi<LinkedGoal[]>(
        `/api/v1/goals/${goalId}/links`
      );
      return payload.data ?? [];
    },
  });

  const goalsQuery = useQuery({
    queryKey: ["all-goals-for-link-resolution"],
    queryFn: async () => {
      const payload = await fetchApi<GoalRecord[]>("/api/v1/goals");
      return payload.data ?? [];
    },
  });

  const goalMap = new Map(
    (goalsQuery.data ?? []).map((goal) => [goal.id, goal])
  );

  return (
    <div className="space-y-2 rounded-md border p-4">
      <h3 className="text-sm font-semibold">Linked goals</h3>
      {linksQuery.data?.map((link) => {
        const upstreamGoal = goalMap.get(link.upstream_goal_id);
        return (
          <Link
            key={`${link.goal_id}-${link.upstream_goal_id}`}
            href={`/goals/${link.upstream_goal_id}`}
            className="hover:border-primary/50 block rounded-md border p-2 text-sm transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span>{upstreamGoal?.title ?? link.upstream_goal_id}</span>
              <Badge variant="outline">{link.link_type}</Badge>
            </div>
          </Link>
        );
      })}
      {linksQuery.data?.length === 0 ? (
        <p className="text-muted-foreground text-xs">No linked goals yet.</p>
      ) : null}
    </div>
  );
}
