"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { BoardKanban } from "@/components/workboard/board-kanban";
import { BoardList } from "@/components/workboard/board-list";
import { BoardSwitcher } from "@/components/workboard/board-switcher";
import { ViewSwitcher } from "@/components/workboard/view-switcher";
import { WorkItemDrawer } from "@/components/workboard/work-item-drawer";
import type {
  WorkboardBoard,
  WorkboardItemsResponse,
  WorkboardView,
} from "@/components/workboard/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchApi } from "@/lib/api/client";

type WorkboardPageProps = {
  preferredBoardType?: "user" | "team";
  heading?: string;
  description?: string;
};

export function WorkboardPage({
  preferredBoardType,
  heading = "Workboard",
  description = "Focus on goal-linked execution with a flexible kanban workflow.",
}: WorkboardPageProps) {
  const queryClient = useQueryClient();
  const [requestedBoardId, setRequestedBoardId] = useState<string | null>(null);
  const [requestedViewId, setRequestedViewId] = useState<string | null>(null);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(
    null
  );
  const [layoutMode, setLayoutMode] = useState<"kanban" | "list">("kanban");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const boardsQuery = useQuery({
    queryKey: ["workboard-boards"],
    queryFn: async () => {
      const payload = await fetchApi<WorkboardBoard[]>("/api/v1/boards");
      return payload.data ?? [];
    },
  });

  const selectedBoardId = useMemo(() => {
    if (!boardsQuery.data?.length) return "";
    if (
      requestedBoardId &&
      boardsQuery.data.some((board) => board.id === requestedBoardId)
    ) {
      return requestedBoardId;
    }

    const preferred = preferredBoardType
      ? boardsQuery.data.find((board) => board.type === preferredBoardType)
      : undefined;
    return preferred?.id ?? boardsQuery.data[0].id;
  }, [boardsQuery.data, preferredBoardType, requestedBoardId]);

  const viewsQuery = useQuery({
    queryKey: ["workboard-views", selectedBoardId],
    enabled: Boolean(selectedBoardId),
    queryFn: async () => {
      const payload = await fetchApi<WorkboardView[]>(
        `/api/v1/boards/${selectedBoardId}/views`
      );
      return payload.data ?? [];
    },
  });

  const selectedViewId = useMemo(() => {
    if (!viewsQuery.data?.length) return "all";
    if (
      requestedViewId &&
      viewsQuery.data.some((view) => view.id === requestedViewId)
    ) {
      return requestedViewId;
    }
    return viewsQuery.data[0]?.id ?? "all";
  }, [requestedViewId, viewsQuery.data]);

  const itemsQuery = useQuery({
    queryKey: [
      "workboard-items",
      selectedBoardId,
      selectedViewId,
      searchQuery,
      layoutMode,
    ],
    enabled: Boolean(selectedBoardId && selectedViewId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (layoutMode === "list") params.set("includeDone", "true");
      const queryString = params.toString();
      const endpoint = `/api/v1/boards/${selectedBoardId}/views/${selectedViewId}/items${
        queryString ? `?${queryString}` : ""
      }`;
      const payload = await fetchApi<WorkboardItemsResponse>(endpoint);
      return payload.data;
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({
      itemId,
      toColumnId,
      prevItemId,
      nextItemId,
    }: {
      itemId: string;
      toColumnId: string;
      prevItemId: string | null;
      nextItemId: string | null;
    }) =>
      fetchApi(
        `/api/v1/boards/${selectedBoardId}/views/${selectedViewId}/items/${itemId}/move`,
        {
          method: "POST",
          body: JSON.stringify({
            toColumnId,
            prevWorkItemId: prevItemId,
            nextWorkItemId: nextItemId,
          }),
        }
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["workboard-items", selectedBoardId, selectedViewId],
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (title: string) =>
      fetchApi("/api/v1/work-items", {
        method: "POST",
        body: JSON.stringify({
          title,
          statusKey: "backlog",
          visibility: "team",
        }),
      }),
    onSuccess: async () => {
      setNewItemTitle("");
      await queryClient.invalidateQueries({
        queryKey: ["workboard-items", selectedBoardId, selectedViewId],
      });
    },
  });

  const selectedBoard = useMemo(
    () =>
      boardsQuery.data?.find((board) => board.id === selectedBoardId) ?? null,
    [boardsQuery.data, selectedBoardId]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-3">
          <div>
            <CardTitle>{heading}</CardTitle>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,340px)_1fr_auto] md:items-center">
            <BoardSwitcher
              boards={boardsQuery.data ?? []}
              value={selectedBoardId}
              onValueChange={(nextBoardId) => {
                setRequestedBoardId(nextBoardId);
                setRequestedViewId(null);
              }}
            />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search board items..."
            />
            <Badge variant="outline">
              {selectedBoard?.type === "team" ? "Team board" : "Personal board"}
            </Badge>
          </div>
          <ViewSwitcher
            views={viewsQuery.data ?? []}
            value={selectedViewId}
            onValueChange={setRequestedViewId}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="w-full md:max-w-sm"
              value={newItemTitle}
              onChange={(event) => setNewItemTitle(event.target.value)}
              placeholder="Add work item..."
            />
            <Button
              onClick={() => {
                if (!newItemTitle.trim()) return;
                createMutation.mutate(newItemTitle.trim());
              }}
              disabled={createMutation.isPending}
              className="gap-1"
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={layoutMode}
            onValueChange={(value) => setLayoutMode(value as "kanban" | "list")}
          >
            <TabsList>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>

          {boardsQuery.isLoading ||
          viewsQuery.isLoading ||
          itemsQuery.isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading workboard...
            </div>
          ) : null}

          {itemsQuery.data && layoutMode === "kanban" ? (
            <BoardKanban
              data={itemsQuery.data}
              onMove={async (payload) => {
                await moveMutation.mutateAsync(payload);
              }}
              onCardClick={setSelectedWorkItemId}
              isSaving={moveMutation.isPending}
            />
          ) : null}

          {itemsQuery.data && layoutMode === "list" ? (
            <BoardList
              data={itemsQuery.data}
              onRowClick={setSelectedWorkItemId}
            />
          ) : null}
        </CardContent>
      </Card>

      <WorkItemDrawer
        key={selectedWorkItemId ?? "work-item-drawer"}
        workItemId={selectedWorkItemId}
        open={Boolean(selectedWorkItemId)}
        onOpenChange={(open) => {
          if (!open) setSelectedWorkItemId(null);
        }}
        onChanged={async () => {
          await queryClient.invalidateQueries({
            queryKey: ["workboard-items", selectedBoardId, selectedViewId],
          });
        }}
      />
    </div>
  );
}
