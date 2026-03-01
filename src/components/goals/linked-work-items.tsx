"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api/client";

type LinkedWorkItem = {
  id: string;
  title: string;
  status_key: "backlog" | "next" | "doing" | "waiting" | "done";
  priority: "low" | "medium" | "high" | "urgent";
};

type LinkedWorkItemsProps = {
  goalId: string;
};

export function LinkedWorkItems({ goalId }: LinkedWorkItemsProps) {
  const workItemsQuery = useQuery({
    queryKey: ["goal-linked-work-items", goalId],
    queryFn: async () => {
      const payload = await fetchApi<LinkedWorkItem[]>(
        `/api/v1/work-items?goalId=${goalId}`
      );
      return payload.data ?? [];
    },
  });

  return (
    <div className="space-y-2 rounded-md border p-4">
      <h3 className="text-sm font-semibold">Linked work items</h3>
      {workItemsQuery.data?.map((workItem) => (
        <Link
          key={workItem.id}
          href={`/workboard`}
          className="hover:border-primary/50 block rounded-md border p-2 text-sm transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span>{workItem.title}</span>
            <div className="flex items-center gap-1">
              <Badge variant="outline">{workItem.status_key}</Badge>
              <Badge variant="secondary">{workItem.priority}</Badge>
            </div>
          </div>
        </Link>
      ))}
      {workItemsQuery.data?.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No work items linked yet.
        </p>
      ) : null}
    </div>
  );
}
