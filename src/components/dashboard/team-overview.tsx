"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchApi } from "@/lib/api/client";

type CheckinRecord = {
  id: string;
  user_id: string;
  week_start: string;
  updated_at: string;
};

export function TeamOverview({ mode }: { mode: "team" | "network" }) {
  const checkinsQuery = useQuery({
    queryKey: ["checkins", mode],
    queryFn: async () => {
      const payload = await fetchApi<CheckinRecord[]>("/api/v1/checkins");
      return payload.data ?? [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "team" ? "My Team" : "Network"}</CardTitle>
        <CardDescription>
          {mode === "team"
            ? "Recent check-ins from people you support directly."
            : "Cross-team pulse from peers and collaborators."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {checkinsQuery.data?.map((checkin) => (
          <div key={checkin.id} className="rounded-md border p-3 text-sm">
            <p className="font-medium">User: {checkin.user_id}</p>
            <p className="text-muted-foreground text-xs">
              Week: {checkin.week_start}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
