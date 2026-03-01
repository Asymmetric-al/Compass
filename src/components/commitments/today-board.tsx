"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

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
import type { DbCommitment } from "@/types/db";

function getNextStatus(status: DbCommitment["status"]): DbCommitment["status"] {
  if (status === "planned") return "in_progress";
  if (status === "in_progress") return "done";
  if (status === "blocked") return "in_progress";
  return status;
}

export function TodayBoard() {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();

  const commitmentsQuery = useQuery({
    queryKey: ["today-commitments"],
    queryFn: async () => {
      const payload = await fetchApi<DbCommitment[]>(
        "/api/v1/commitments?status=planned"
      );
      return payload.data ?? [];
    },
  });

  const createCommitment = useMutation({
    mutationFn: async (newTitle: string) =>
      fetchApi<DbCommitment>("/api/v1/commitments", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          status: "planned",
          weight: 10,
          priorityRank: 0,
        }),
      }),
    onSuccess: async () => {
      setTitle("");
      await queryClient.invalidateQueries({ queryKey: ["today-commitments"] });
    },
  });

  const updateCommitment = useMutation({
    mutationFn: async (item: DbCommitment) =>
      fetchApi<DbCommitment>(`/api/v1/commitments/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: getNextStatus(item.status),
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["today-commitments"] });
    },
  });

  const sortedCommitments = useMemo(() => {
    if (!commitmentsQuery.data) return [];
    return [...commitmentsQuery.data].sort((a, b) => {
      if (a.priority_rank !== b.priority_rank) {
        return a.priority_rank - b.priority_rank;
      }
      return b.weight - a.weight;
    });
  }, [commitmentsQuery.data]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s commitments</CardTitle>
          <CardDescription>
            Work from top priority and weight so stewardship stays focused.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!title.trim()) return;
              createCommitment.mutate(title.trim());
            }}
          >
            <Label htmlFor="commitment-title">Add commitment</Label>
            <div className="flex gap-2">
              <Input
                id="commitment-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Call regional director for coaching follow-up"
              />
              <Button type="submit" disabled={createCommitment.isPending}>
                {createCommitment.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>

          {commitmentsQuery.isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading commitments...
            </div>
          ) : null}

          {commitmentsQuery.isError ? (
            <p className="text-destructive text-sm">
              {(commitmentsQuery.error as Error).message}
            </p>
          ) : null}

          <div className="space-y-2">
            {sortedCommitments.map((item) => (
              <div
                key={item.id}
                className="bg-muted/40 flex items-center justify-between rounded-md border p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Priority {item.priority_rank}
                    </Badge>
                    <Badge variant="secondary">Weight {item.weight}</Badge>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateCommitment.mutate(item)}
                  disabled={updateCommitment.isPending}
                >
                  Mark {getNextStatus(item.status).replace("_", " ")}
                </Button>
              </div>
            ))}

            {sortedCommitments.length === 0 && !commitmentsQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">
                No commitments yet. Add your first stewardship commitment above.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
