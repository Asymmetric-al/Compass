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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchApi } from "@/lib/api/client";
import type { DbAim } from "@/types/db";

export function AimsDashboard() {
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<"org" | "team" | "user">("org");
  const queryClient = useQueryClient();

  const aimsQuery = useQuery({
    queryKey: ["aims"],
    queryFn: async () => {
      const payload = await fetchApi<DbAim[]>("/api/v1/aims");
      return payload.data ?? [];
    },
  });

  const createAim = useMutation({
    mutationFn: async () =>
      fetchApi<DbAim>("/api/v1/aims", {
        method: "POST",
        body: JSON.stringify({
          title,
          scope,
          classification: "normal",
        }),
      }),
    onSuccess: async () => {
      setTitle("");
      await queryClient.invalidateQueries({ queryKey: ["aims"] });
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Aims</CardTitle>
          <CardDescription>
            Define prayerfully discerned aims, then connect lead and lag
            measures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              if (!title.trim()) return;
              createAim.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="aim-title">Aim title</Label>
              <Input
                id="aim-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Strengthen missionary care and resilience"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Scope</Label>
              <Select
                value={scope}
                onValueChange={(value) => setScope(value as typeof scope)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org">Org</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={createAim.isPending}
                className="w-full"
              >
                {createAim.isPending ? "Creating..." : "Create aim"}
              </Button>
            </div>
          </form>

          {aimsQuery.isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading aims...
            </div>
          ) : null}

          {aimsQuery.isError ? (
            <p className="text-destructive text-sm">
              {(aimsQuery.error as Error).message}
            </p>
          ) : null}

          <div className="space-y-2">
            {aimsQuery.data?.map((aim) => (
              <div key={aim.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{aim.title}</p>
                    <p className="text-muted-foreground text-xs">
                      Scope: {aim.scope} · Classification: {aim.classification}
                    </p>
                  </div>
                  <Badge variant="outline">{aim.scope}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
