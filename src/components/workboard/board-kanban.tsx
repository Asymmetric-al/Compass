"use client";

import { KanbanBoard } from "@/components/kanban/kanban";
import { WorkItemCard } from "@/components/workboard/work-item-card";
import type { WorkboardItemsResponse } from "@/components/workboard/types";

type BoardKanbanProps = {
  data: WorkboardItemsResponse | undefined;
  onMove: (payload: {
    itemId: string;
    toColumnId: string;
    prevItemId: string | null;
    nextItemId: string | null;
  }) => Promise<void> | void;
  onCardClick: (workItemId: string) => void;
  isSaving?: boolean;
};

export function BoardKanban({
  data,
  onMove,
  onCardClick,
  isSaving,
}: BoardKanbanProps) {
  const columns =
    data?.columns.map((entry) => ({
      id: entry.column.id,
      title: entry.column.name,
      wipLimit: entry.column.wip_limit,
    })) ?? [];

  const itemsByColumn = Object.fromEntries(
    (data?.columns ?? []).map((entry) => [entry.column.id, entry.items])
  );

  return (
    <KanbanBoard
      columns={columns}
      itemsByColumn={itemsByColumn}
      onMove={onMove}
      onItemClick={(item) => onCardClick(item.id)}
      isSaving={isSaving}
      renderItem={(item) => <WorkItemCard item={item} />}
    />
  );
}
