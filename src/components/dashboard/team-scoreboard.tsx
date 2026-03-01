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

type AimRecord = {
  id: string;
  title: string;
  scope: string;
};

export function TeamScoreboard({
  teamId,
  teamType,
}: {
  teamId: string;
  teamType: "department" | "region";
}) {
  const aimsQuery = useQuery({
    queryKey: ["team-scoreboard", teamType, teamId],
    queryFn: async () => {
      const payload = await fetchApi<AimRecord[]>(
        `/api/v1/aims?teamId=${teamId}&scope=team`
      );
      return payload.data ?? [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {teamType === "department" ? "Department" : "Region"} Scoreboard
        </CardTitle>
        <CardDescription>
          Current aims and commitments connected to this {teamType}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {aimsQuery.data?.map((aim) => (
          <div key={aim.id} className="rounded-md border p-3 text-sm">
            {aim.title}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
