"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api/client";

type MissionaryRecord = {
  id: string;
  code_name: string | null;
  public_name: string | null;
  status: string;
  location_text: string | null;
  classification: string;
  region_team_id: string;
};

export function MissionariesBoard() {
  const [regionTeamId, setRegionTeamId] = useState("");
  const [codeName, setCodeName] = useState("");
  const [publicName, setPublicName] = useState("");
  const queryClient = useQueryClient();

  const missionariesQuery = useQuery({
    queryKey: ["missionaries"],
    queryFn: async () => {
      const payload = await fetchApi<MissionaryRecord[]>(
        "/api/v1/missionaries"
      );
      return payload.data ?? [];
    },
  });

  const createMissionary = useMutation({
    mutationFn: async () =>
      fetchApi<MissionaryRecord>("/api/v1/missionaries", {
        method: "POST",
        body: JSON.stringify({
          regionTeamId,
          codeName: codeName || null,
          publicName: publicName || null,
          classification: "sensitive",
        }),
      }),
    onSuccess: async () => {
      setCodeName("");
      setPublicName("");
      await queryClient.invalidateQueries({ queryKey: ["missionaries"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Missionaries</CardTitle>
        <CardDescription>
          Staff-only records for missionary support with region-scoped
          visibility.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!regionTeamId.trim()) return;
            createMissionary.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="region-team-id">Region team ID</Label>
            <Input
              id="region-team-id"
              value={regionTeamId}
              onChange={(event) => setRegionTeamId(event.target.value)}
              placeholder="UUID for region team"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="code-name">Code name</Label>
            <Input
              id="code-name"
              value={codeName}
              onChange={(event) => setCodeName(event.target.value)}
              placeholder="Optional secure codename"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="public-name">Public name</Label>
            <Input
              id="public-name"
              value={publicName}
              onChange={(event) => setPublicName(event.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={createMissionary.isPending}
            className="md:col-span-2"
          >
            {createMissionary.isPending ? "Creating..." : "Add missionary"}
          </Button>
        </form>

        {missionariesQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading missionary records...
          </div>
        ) : null}

        <div className="space-y-2">
          {missionariesQuery.data?.map((item) => (
            <div key={item.id} className="rounded-md border p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {item.code_name ?? item.public_name ?? "Unnamed missionary"}
                </p>
                <Badge variant="secondary">{item.classification}</Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                Status: {item.status} · Region: {item.region_team_id}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
