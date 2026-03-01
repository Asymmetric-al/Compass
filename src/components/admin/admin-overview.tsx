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

type TeamRecord = {
  id: string;
  type: "department" | "region";
};

type CycleRecord = {
  id: string;
  type: "annual" | "quarterly";
  is_active: boolean;
};

export function AdminOverview() {
  const teamsQuery = useQuery({
    queryKey: ["admin", "teams"],
    queryFn: async () => {
      const payload = await fetchApi<TeamRecord[]>("/api/v1/teams");
      return payload.data ?? [];
    },
  });

  const cyclesQuery = useQuery({
    queryKey: ["admin", "cycles"],
    queryFn: async () => {
      const payload = await fetchApi<CycleRecord[]>("/api/v1/cycles");
      return payload.data ?? [];
    },
  });

  const departmentCount =
    teamsQuery.data?.filter((item) => item.type === "department").length ?? 0;
  const regionCount =
    teamsQuery.data?.filter((item) => item.type === "region").length ?? 0;
  const activeCycleCount =
    cyclesQuery.data?.filter((cycle) => cycle.is_active).length ?? 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Departments</CardTitle>
          <CardDescription>Configured operational departments</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{departmentCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regions</CardTitle>
          <CardDescription>Regional compartments in use</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{regionCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Cycles</CardTitle>
          <CardDescription>
            Current annual and quarterly focus windows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{activeCycleCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
