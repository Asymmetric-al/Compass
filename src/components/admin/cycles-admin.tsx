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

type CycleRecord = {
  id: string;
  type: "annual" | "quarterly";
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

export function CyclesAdmin() {
  const [name, setName] = useState("");
  const [type, setType] = useState<"annual" | "quarterly">("quarterly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const queryClient = useQueryClient();

  const cyclesQuery = useQuery({
    queryKey: ["admin-cycles"],
    queryFn: async () => {
      const payload = await fetchApi<CycleRecord[]>("/api/v1/cycles");
      return payload.data ?? [];
    },
  });

  const createCycle = useMutation({
    mutationFn: async () =>
      fetchApi<CycleRecord>("/api/v1/cycles", {
        method: "POST",
        body: JSON.stringify({
          type,
          name,
          startDate,
          endDate,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-cycles"] });
    },
  });

  const activateCycle = useMutation({
    mutationFn: async (cycle: CycleRecord) =>
      fetchApi<CycleRecord>(`/api/v1/cycles/${cycle.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: true }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-cycles"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cycles</CardTitle>
        <CardDescription>
          Create annual/quarterly cycles and activate them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            createCycle.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="cycle-name">Name</Label>
            <Input
              id="cycle-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
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
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="start-date">Start date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end-date">End date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={createCycle.isPending}>
            {createCycle.isPending ? "Creating..." : "Create cycle"}
          </Button>
        </form>

        <div className="space-y-2">
          {cyclesQuery.data?.map((cycle) => (
            <div
              key={cycle.id}
              className="flex items-center justify-between rounded-md border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{cycle.name}</p>
                <p className="text-muted-foreground">
                  {cycle.type} · {cycle.start_date} → {cycle.end_date}
                </p>
              </div>
              <Button
                size="sm"
                variant={cycle.is_active ? "secondary" : "outline"}
                onClick={() => activateCycle.mutate(cycle)}
                disabled={activateCycle.isPending || cycle.is_active}
              >
                {cycle.is_active ? "Active" : "Activate"}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
