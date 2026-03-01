"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { ChecklistPanel } from "@/components/workboard/checklist-panel";
import { GoalLinkPanel } from "@/components/workboard/goal-link-panel";
import { TagsPanel } from "@/components/workboard/tags-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchApi } from "@/lib/api/client";

type WorkItemDetail = {
  id: string;
  title: string;
  status_key: "backlog" | "next" | "doing" | "waiting" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  goals: Array<{ goal_id: string; is_primary: boolean }>;
  checklist: Array<{
    id: string;
    text: string;
    is_done: boolean;
    sort_order: number;
    completed_at: string | null;
  }>;
};

type WorkItemTags = {
  teamIds: string[];
  missionaryIds: string[];
  labelIds: string[];
};

type WorkItemDrawerProps = {
  workItemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => Promise<void> | void;
};

export function WorkItemDrawer({
  workItemId,
  open,
  onOpenChange,
  onChanged,
}: WorkItemDrawerProps) {
  const queryClient = useQueryClient();
  const detailQuery = useQuery({
    queryKey: ["work-item-detail", workItemId],
    enabled: Boolean(workItemId && open),
    queryFn: async () => {
      const payload = await fetchApi<WorkItemDetail>(
        `/api/v1/work-items/${workItemId}`
      );
      return payload.data;
    },
  });

  const tagsQuery = useQuery({
    queryKey: ["work-item-tags", workItemId],
    enabled: Boolean(workItemId && open),
    queryFn: async () => {
      const payload = await fetchApi<WorkItemTags>(
        `/api/v1/work-items/${workItemId}/tags`
      );
      return payload.data;
    },
  });

  const [title, setTitle] = useState("");

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["work-item-detail", workItemId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["work-item-tags", workItemId],
      }),
    ]);
    await onChanged();
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      fetchApi<WorkItemDetail>(`/api/v1/work-items/${workItemId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: invalidate,
  });

  const addChecklistMutation = useMutation({
    mutationFn: async (text: string) =>
      fetchApi(`/api/v1/work-items/${workItemId}/checklist`, {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
    onSuccess: invalidate,
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: async ({
      checklistItemId,
      isDone,
    }: {
      checklistItemId: string;
      isDone: boolean;
    }) =>
      fetchApi(
        `/api/v1/work-items/${workItemId}/checklist/${checklistItemId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isDone }),
        }
      ),
    onSuccess: invalidate,
  });

  const saveTagsMutation = useMutation({
    mutationFn: async (payload: WorkItemTags) =>
      fetchApi(`/api/v1/work-items/${workItemId}/tags`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: invalidate,
  });

  const addGoalLinkMutation = useMutation({
    mutationFn: async ({
      goalId,
      isPrimary,
    }: {
      goalId: string;
      isPrimary: boolean;
    }) =>
      fetchApi(`/api/v1/work-items/${workItemId}/goals`, {
        method: "POST",
        body: JSON.stringify({ goalId, isPrimary }),
      }),
    onSuccess: invalidate,
  });

  const removeGoalLinkMutation = useMutation({
    mutationFn: async (goalId: string) =>
      fetchApi(`/api/v1/work-items/${workItemId}/goals/${goalId}`, {
        method: "DELETE",
      }),
    onSuccess: invalidate,
  });

  const allTagShape = useMemo(
    () => ({
      teams: (tagsQuery.data?.teamIds ?? []).map((id) => ({
        team_id: id,
        name: id,
      })),
      missionaries: (tagsQuery.data?.missionaryIds ?? []).map((id) => ({
        missionary_id: id,
        name: id,
      })),
      labels: (tagsQuery.data?.labelIds ?? []).map((id) => ({
        label_id: id,
        name: id,
      })),
    }),
    [tagsQuery.data]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Work item detail</SheetTitle>
        </SheetHeader>

        {!workItemId ? null : detailQuery.isLoading ? (
          <div className="text-muted-foreground mt-6 flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading work item...
          </div>
        ) : detailQuery.data ? (
          <div className="mt-4 space-y-6">
            <div className="space-y-2">
              <Input
                value={title || detailQuery.data?.title || ""}
                onChange={(event) => setTitle(event.target.value)}
              />
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Status: {detailQuery.data.status_key}
                </Badge>
                <Badge variant="secondary">
                  Priority: {detailQuery.data.priority}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    updateMutation.mutate({
                      title: title || detailQuery.data?.title || "",
                    })
                  }
                >
                  Save title
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    updateMutation.mutate({
                      statusKey:
                        detailQuery.data?.status_key === "done"
                          ? "doing"
                          : "done",
                    })
                  }
                >
                  Toggle done
                </Button>
              </div>
            </div>

            <ChecklistPanel
              items={detailQuery.data.checklist}
              onAdd={(text) => addChecklistMutation.mutateAsync(text)}
              onToggle={(checklistItemId, isDone) =>
                toggleChecklistMutation.mutateAsync({ checklistItemId, isDone })
              }
            />

            <GoalLinkPanel
              links={detailQuery.data.goals}
              onAdd={(goalId, isPrimary) =>
                addGoalLinkMutation.mutateAsync({ goalId, isPrimary })
              }
              onRemove={(goalId) => removeGoalLinkMutation.mutateAsync(goalId)}
            />

            <TagsPanel
              tags={allTagShape}
              onSave={(payload) => saveTagsMutation.mutateAsync(payload)}
            />
          </div>
        ) : (
          <p className="text-muted-foreground mt-6 text-sm">
            Unable to load work item detail.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
