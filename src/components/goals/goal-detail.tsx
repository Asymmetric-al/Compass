"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { LinkedGoals } from "@/components/goals/linked-goals";
import { LinkedWorkItems } from "@/components/goals/linked-work-items";
import { MeasureEditor } from "@/components/goals/measure-editor";
import { MeasureUpdates } from "@/components/goals/measure-updates";
import type { GoalMeasureRecord, GoalRecord } from "@/components/goals/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/lib/api/client";

type GoalDetailProps = {
  goalId: string;
};

export function GoalDetail({ goalId }: GoalDetailProps) {
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(
    null
  );
  const goalQuery = useQuery({
    queryKey: ["goal-detail", goalId],
    queryFn: async () => {
      const payload = await fetchApi<GoalRecord>(`/api/v1/goals/${goalId}`);
      return payload.data;
    },
  });

  const measuresQuery = useQuery({
    queryKey: ["goal-measures", goalId],
    queryFn: async () => {
      const payload = await fetchApi<GoalMeasureRecord[]>(
        `/api/v1/goals/${goalId}/measures`
      );
      return payload.data ?? [];
    },
  });

  const selectedMeasure = useMemo(
    () =>
      measuresQuery.data?.find((measure) => measure.id === selectedMeasureId),
    [measuresQuery.data, selectedMeasureId]
  );

  if (!goalQuery.data) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-sm">
          Loading goal details...
        </CardContent>
      </Card>
    );
  }

  const goal = goalQuery.data;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-xl">{goal.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{goal.scope_type}</Badge>
              <Badge variant="secondary">{goal.status}</Badge>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            {goal.description_text || "No narrative added yet."}
          </p>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">{goal.timebox_type}</Badge>
            <Badge variant="outline">{goal.visibility}</Badge>
            <span>
              {goal.start_date} → {goal.end_date}
            </span>
          </div>
        </CardHeader>
      </Card>

      <MeasureEditor goalId={goalId} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Measure history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(measuresQuery.data ?? []).map((measure) => (
              <button
                key={measure.id}
                type="button"
                onClick={() => setSelectedMeasureId(measure.id)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  selectedMeasureId === measure.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {measure.name}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            {selectedMeasure
              ? `Viewing updates for ${selectedMeasure.name}.`
              : "Select a measure to add updates."}
          </p>
          <MeasureUpdates measureId={selectedMeasureId} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <LinkedWorkItems goalId={goalId} />
        <LinkedGoals goalId={goalId} />
      </div>
    </div>
  );
}
