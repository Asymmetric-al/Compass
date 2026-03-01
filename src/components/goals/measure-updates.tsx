"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchApi } from "@/lib/api/client";

type GoalMeasureUpdate = {
  id: string;
  occurred_at: string;
  value: number | null;
  note_text: string | null;
};

type MeasureUpdatesProps = {
  measureId: string | null;
};

export function MeasureUpdates({ measureId }: MeasureUpdatesProps) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");

  const updatesQuery = useQuery({
    queryKey: ["goal-measure-updates", measureId],
    enabled: Boolean(measureId),
    queryFn: async () => {
      const payload = await fetchApi<GoalMeasureUpdate[]>(
        `/api/v1/measures/${measureId}/updates`
      );
      return payload.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      fetchApi(`/api/v1/measures/${measureId}/updates`, {
        method: "POST",
        body: JSON.stringify({
          value: value ? Number(value) : null,
          noteText: note || null,
          occurredAt: date || new Date().toISOString().slice(0, 10),
        }),
      }),
    onSuccess: async () => {
      setValue("");
      setNote("");
      await queryClient.invalidateQueries({
        queryKey: ["goal-measure-updates", measureId],
      });
      await queryClient.invalidateQueries({ queryKey: ["goal-measures"] });
    },
  });

  if (!measureId) {
    return (
      <p className="text-muted-foreground text-sm">
        Select a measure above to view its update history.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <h3 className="text-sm font-semibold">Measure updates</h3>
      <div className="grid gap-2 md:grid-cols-[120px_1fr_140px_auto]">
        <Input
          type="number"
          placeholder="Value"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Input
          placeholder="Note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <Input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {updatesQuery.data?.map((update) => (
          <div key={update.id} className="rounded-md border p-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{update.value ?? "—"}</span>
              <span className="text-muted-foreground text-xs">
                {update.occurred_at}
              </span>
            </div>
            {update.note_text ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {update.note_text}
              </p>
            ) : null}
          </div>
        ))}
        {updatesQuery.data?.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No updates yet. Add your first progress entry.
          </p>
        ) : null}
      </div>
    </div>
  );
}
