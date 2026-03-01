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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchApi } from "@/lib/api/client";

type TeamRecord = {
  id: string;
  type: "department" | "region";
  slug: string;
  name: string;
};

export function TeamsAdmin() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<"department" | "region">("department");
  const queryClient = useQueryClient();

  const teamsQuery = useQuery({
    queryKey: ["admin-teams"],
    queryFn: async () => {
      const payload = await fetchApi<TeamRecord[]>("/api/v1/teams");
      return payload.data ?? [];
    },
  });

  const createTeam = useMutation({
    mutationFn: async () =>
      fetchApi<TeamRecord>("/api/v1/teams", {
        method: "POST",
        body: JSON.stringify({ name, slug, type }),
      }),
    onSuccess: async () => {
      setName("");
      setSlug("");
      await queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team administration</CardTitle>
        <CardDescription>
          Create and review departments and regions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            createTeam.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="team-name">Name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="team-slug">Slug</Label>
            <Input
              id="team-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as typeof type)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="region">Region</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={createTeam.isPending}>
              {createTeam.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          {teamsQuery.data?.map((team) => (
            <div key={team.id} className="rounded-md border p-3 text-sm">
              {team.name} · {team.type} · {team.slug}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
