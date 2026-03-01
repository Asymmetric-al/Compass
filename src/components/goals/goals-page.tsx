"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { GoalsShell } from "@/components/goals/goals-shell";
import { MyGoalsBoard } from "@/components/goals/my-goals-board";
import { OrgGoalsBoard } from "@/components/goals/org-goals-board";
import { TeamGoalsBoard } from "@/components/goals/team-goals-board";
import type { GoalRecord } from "@/components/goals/types";
import { fetchApi } from "@/lib/api/client";

type GoalsPageProps = {
  tab: "my" | "org" | "team";
};

export function GoalsPage({ tab }: GoalsPageProps) {
  const queryClient = useQueryClient();
  const scopeType = tab === "my" ? "user" : tab === "team" ? "team" : "org";

  const goalsQuery = useQuery({
    queryKey: ["goals", scopeType],
    queryFn: async () => {
      const payload = await fetchApi<GoalRecord[]>(
        `/api/v1/goals?scopeType=${scopeType}`
      );
      return payload.data ?? [];
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (payload: {
      scopeType: "org" | "team" | "user";
      title: string;
      timeboxType: "annual" | "quarterly" | "monthly" | "weekly" | "custom";
      startDate: string;
      endDate: string;
      visibility: "org" | "team" | "private";
    }) =>
      fetchApi("/api/v1/goals", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return (
    <GoalsShell
      activeTab={tab}
      onCreateGoal={(payload) => createGoalMutation.mutateAsync(payload)}
    >
      {tab === "my" ? (
        <MyGoalsBoard
          goals={goalsQuery.data ?? []}
          isLoading={goalsQuery.isLoading}
        />
      ) : null}
      {tab === "org" ? (
        <OrgGoalsBoard
          goals={goalsQuery.data ?? []}
          isLoading={goalsQuery.isLoading}
        />
      ) : null}
      {tab === "team" ? (
        <TeamGoalsBoard
          goals={goalsQuery.data ?? []}
          isLoading={goalsQuery.isLoading}
        />
      ) : null}
    </GoalsShell>
  );
}
