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
import { fetchApi } from "@/lib/api/client";

type ReportingLine = {
  id: string;
  manager_user_id: string;
  report_user_id: string;
};

export function ReportingLinesAdmin() {
  const [managerUserId, setManagerUserId] = useState("");
  const [reportUserId, setReportUserId] = useState("");
  const queryClient = useQueryClient();

  const linesQuery = useQuery({
    queryKey: ["admin-reporting-lines"],
    queryFn: async () => {
      const payload = await fetchApi<ReportingLine[]>(
        "/api/v1/reporting-lines"
      );
      return payload.data ?? [];
    },
  });

  const createLine = useMutation({
    mutationFn: async () =>
      fetchApi<ReportingLine>("/api/v1/reporting-lines", {
        method: "POST",
        body: JSON.stringify({ managerUserId, reportUserId }),
      }),
    onSuccess: async () => {
      setManagerUserId("");
      setReportUserId("");
      await queryClient.invalidateQueries({
        queryKey: ["admin-reporting-lines"],
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reporting lines</CardTitle>
        <CardDescription>
          Define direct-report relationships for team views.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            createLine.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="manager-user-id">Manager user ID</Label>
            <Input
              id="manager-user-id"
              value={managerUserId}
              onChange={(event) => setManagerUserId(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-user-id">Report user ID</Label>
            <Input
              id="report-user-id"
              value={reportUserId}
              onChange={(event) => setReportUserId(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={createLine.isPending}>
            {createLine.isPending ? "Saving..." : "Add reporting line"}
          </Button>
        </form>

        <div className="space-y-2">
          {linesQuery.data?.map((line) => (
            <div key={line.id} className="rounded-md border p-3 text-sm">
              {line.manager_user_id} → {line.report_user_id}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
