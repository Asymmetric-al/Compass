"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { GoalMeasureRecord } from "@/components/goals/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchApi } from "@/lib/api/client";

type MeasureEditorProps = {
  goalId: string;
};

export function MeasureEditor({ goalId }: MeasureEditorProps) {
  const queryClient = useQueryClient();
  const [measureName, setMeasureName] = useState("");
  const [measureKind, setMeasureKind] = useState<"lead" | "outcome">("lead");
  const [targetValue, setTargetValue] = useState("");

  const measuresQuery = useQuery({
    queryKey: ["goal-measures", goalId],
    queryFn: async () => {
      const payload = await fetchApi<GoalMeasureRecord[]>(
        `/api/v1/goals/${goalId}/measures`
      );
      return payload.data ?? [];
    },
  });

  const createMeasureMutation = useMutation({
    mutationFn: async () =>
      fetchApi(`/api/v1/goals/${goalId}/measures`, {
        method: "POST",
        body: JSON.stringify({
          kind: measureKind,
          name: measureName,
          targetValue: targetValue ? Number(targetValue) : null,
          currentValue: null,
        }),
      }),
    onSuccess: async () => {
      setMeasureName("");
      setTargetValue("");
      await queryClient.invalidateQueries({
        queryKey: ["goal-measures", goalId],
      });
    },
  });

  return (
    <div className="space-y-3 rounded-md border p-4">
      <h3 className="text-sm font-semibold">Lead & outcome measures</h3>
      <div className="grid gap-2 md:grid-cols-[120px_1fr_140px_auto]">
        <select
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={measureKind}
          onChange={(event) =>
            setMeasureKind(event.target.value as "lead" | "outcome")
          }
        >
          <option value="lead">Lead</option>
          <option value="outcome">Outcome</option>
        </select>
        <Input
          value={measureName}
          onChange={(event) => setMeasureName(event.target.value)}
          placeholder="e.g. Weekly coaching touches"
        />
        <Input
          value={targetValue}
          onChange={(event) => setTargetValue(event.target.value)}
          placeholder="Target"
          type="number"
        />
        <Button
          disabled={!measureName.trim() || createMeasureMutation.isPending}
          onClick={() => createMeasureMutation.mutate()}
        >
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {measuresQuery.data?.map((measure) => (
          <div
            key={measure.id}
            className="bg-muted/40 flex items-center justify-between rounded-md border p-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline">{measure.kind}</Badge>
              <span>{measure.name}</span>
            </div>
            <div className="text-muted-foreground text-xs">
              {measure.current_value ?? 0} / {measure.target_value ?? "—"}
            </div>
          </div>
        ))}
        {measuresQuery.data?.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No measures yet. Add a lead or outcome metric.
          </p>
        ) : null}
      </div>
    </div>
  );
}
