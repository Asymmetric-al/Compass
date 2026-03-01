"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchApi } from "@/lib/api/client";

type MissionaryUpdate = {
  id: string;
  month: string;
  summary_json: { text?: string };
  prayer_json: { text?: string };
};

function currentMonthDate() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function MissionaryUpdatesBoard({
  missionaryId,
}: {
  missionaryId: string;
}) {
  const [summary, setSummary] = useState("");
  const [prayer, setPrayer] = useState("");
  const queryClient = useQueryClient();

  const updatesQuery = useQuery({
    queryKey: ["missionary-updates", missionaryId],
    queryFn: async () => {
      const payload = await fetchApi<MissionaryUpdate[]>(
        `/api/v1/missionaries/${missionaryId}/updates`
      );
      return payload.data ?? [];
    },
  });

  const saveUpdate = useMutation({
    mutationFn: async () =>
      fetchApi(`/api/v1/missionaries/${missionaryId}/updates`, {
        method: "POST",
        body: JSON.stringify({
          month: currentMonthDate(),
          summaryJson: { text: summary },
          prayerJson: { text: prayer },
        }),
      }),
    onSuccess: async () => {
      setSummary("");
      setPrayer("");
      await queryClient.invalidateQueries({
        queryKey: ["missionary-updates", missionaryId],
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Missionary monthly updates</CardTitle>
        <CardDescription>
          Record support updates, fruit observations, and current prayer
          requests.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            saveUpdate.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prayer">Prayer</Label>
            <Textarea
              id="prayer"
              value={prayer}
              onChange={(event) => setPrayer(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={saveUpdate.isPending}>
            {saveUpdate.isPending ? "Saving..." : "Save update"}
          </Button>
        </form>

        <div className="space-y-2">
          {updatesQuery.data?.map((update) => (
            <div key={update.id} className="rounded-md border p-3">
              <p className="text-xs font-semibold">{update.month}</p>
              <p className="text-sm">{update.summary_json?.text ?? ""}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Prayer: {update.prayer_json?.text ?? ""}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
