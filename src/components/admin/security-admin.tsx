"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchApi } from "@/lib/api/client";

type AuditEntry = {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
};

export function SecurityAdmin() {
  const auditQuery = useQuery({
    queryKey: ["admin-audit-log"],
    queryFn: async () => {
      const payload = await fetchApi<AuditEntry[]>("/api/v1/audit-log");
      return payload.data ?? [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security and audit</CardTitle>
        <CardDescription>
          Monitor sensitive changes and export leadership scoreboards.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button asChild variant="outline">
          <Link href="/api/v1/exports/scoreboard">Download scoreboard CSV</Link>
        </Button>

        <div className="space-y-2">
          {auditQuery.data?.map((entry) => (
            <div key={entry.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">{entry.action}</p>
              <p className="text-muted-foreground text-xs">
                {entry.entity_type} · {entry.created_at}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
