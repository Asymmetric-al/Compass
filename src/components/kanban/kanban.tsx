"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState } from "react";

type KanbanColumn = {
  id: string;
  title: string;
  wipLimit?: number | null;
};

type KanbanItem = {
  id: string;
};

type KanbanMovePayload = {
  itemId: string;
  toColumnId: string;
  prevItemId: string | null;
  nextItemId: string | null;
};

type KanbanProps<T extends KanbanItem> = {
  columns: KanbanColumn[];
  itemsByColumn: Record<string, T[]>;
  onMove: (payload: KanbanMovePayload) => Promise<void> | void;
  renderItem: (item: T) => React.ReactNode;
  onItemClick?: (item: T) => void;
  isSaving?: boolean;
};

function SortableCard<T extends KanbanItem>({
  item,
  children,
  onClick,
}: {
  item: T;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { type: "card" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "opacity-60" : "opacity-100"}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={
        isOver
          ? "border-primary/30 bg-primary/5 rounded-md border-2 border-dashed p-2"
          : "rounded-md border p-2"
      }
    >
      {children}
    </div>
  );
}

export function KanbanBoard<T extends KanbanItem>({
  columns,
  itemsByColumn,
  onMove,
  renderItem,
  onItemClick,
  isSaving,
}: KanbanProps<T>) {
  const [localState, setLocalState] = useState(itemsByColumn);
  useEffect(() => {
    setLocalState(itemsByColumn);
  }, [itemsByColumn]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const lookup = useMemo(() => {
    const map = new Map<string, { columnId: string; index: number; item: T }>();
    for (const columnId of Object.keys(localState)) {
      const items = localState[columnId] ?? [];
      items.forEach((item, index) => {
        map.set(item.id, { columnId, index, item });
      });
    }
    return map;
  }, [localState]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeEntry = lookup.get(activeId);
    if (!activeEntry) return;

    const isOverColumn = columns.some((column) => column.id === overId);
    const targetEntry = lookup.get(overId);
    const targetColumnId = isOverColumn ? overId : targetEntry?.columnId;
    if (!targetColumnId) return;

    const sourceColumnId = activeEntry.columnId;
    const sourceItems = [...(localState[sourceColumnId] ?? [])];
    const targetItems =
      sourceColumnId === targetColumnId
        ? sourceItems
        : [...(localState[targetColumnId] ?? [])];

    const sourceIndex = activeEntry.index;
    const overIndex = isOverColumn
      ? targetItems.length
      : targetEntry
        ? targetEntry.index
        : targetItems.length;

    if (sourceColumnId === targetColumnId) {
      if (sourceIndex === overIndex) return;
      const reordered = arrayMove(sourceItems, sourceIndex, overIndex);
      setLocalState((prev) => ({
        ...prev,
        [sourceColumnId]: reordered,
      }));

      const movedIndex = reordered.findIndex((item) => item.id === activeId);
      const prevItemId =
        movedIndex > 0 ? (reordered[movedIndex - 1]?.id ?? null) : null;
      const nextItemId =
        movedIndex < reordered.length - 1
          ? (reordered[movedIndex + 1]?.id ?? null)
          : null;
      await onMove({
        itemId: activeId,
        toColumnId: sourceColumnId,
        prevItemId,
        nextItemId,
      });
      return;
    }

    const [moved] = sourceItems.splice(sourceIndex, 1);
    targetItems.splice(overIndex, 0, moved);

    setLocalState((prev) => ({
      ...prev,
      [sourceColumnId]: sourceItems,
      [targetColumnId]: targetItems,
    }));

    const movedIndex = targetItems.findIndex((item) => item.id === activeId);
    const prevItemId =
      movedIndex > 0 ? (targetItems[movedIndex - 1]?.id ?? null) : null;
    const nextItemId =
      movedIndex < targetItems.length - 1
        ? (targetItems[movedIndex + 1]?.id ?? null)
        : null;

    await onMove({
      itemId: activeId,
      toColumnId: targetColumnId,
      prevItemId,
      nextItemId,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-3 lg:grid-cols-5">
        {columns.map((column) => {
          const items = localState[column.id] ?? [];
          return (
            <DroppableColumn key={column.id} id={column.id}>
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{column.title}</h3>
                <div className="text-muted-foreground text-xs">
                  {items.length}
                  {column.wipLimit ? ` / ${column.wipLimit}` : ""}
                </div>
              </div>
              <SortableContext
                items={items.map((item) => item.id as UniqueIdentifier)}
                strategy={rectSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableCard
                      key={item.id}
                      item={item}
                      onClick={
                        onItemClick ? () => onItemClick(item) : undefined
                      }
                    >
                      {renderItem(item)}
                    </SortableCard>
                  ))}
                </div>
              </SortableContext>
            </DroppableColumn>
          );
        })}
      </div>
      {isSaving ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Saving board changes...
        </p>
      ) : null}
    </DndContext>
  );
}
