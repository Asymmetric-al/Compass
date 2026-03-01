"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type ChecklistItem = {
  id: string;
  text: string;
  is_done: boolean;
  sort_order: number;
};

type ChecklistPanelProps = {
  items: ChecklistItem[];
  onToggle: (itemId: string, isDone: boolean) => Promise<unknown> | void;
  onAdd: (text: string) => Promise<unknown> | void;
};

export function ChecklistPanel({
  items,
  onToggle,
  onAdd,
}: ChecklistPanelProps) {
  const [newItemText, setNewItemText] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Checklist</h3>
        <span className="text-muted-foreground text-xs">
          {items.filter((item) => item.is_done).length}/{items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
          >
            <Checkbox
              checked={item.is_done}
              onCheckedChange={(checked) => onToggle(item.id, Boolean(checked))}
            />
            <span
              className={
                item.is_done ? "text-muted-foreground line-through" : ""
              }
            >
              {item.text}
            </span>
          </label>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!newItemText.trim()) return;
          onAdd(newItemText.trim());
          setNewItemText("");
        }}
      >
        <Input
          value={newItemText}
          onChange={(event) => setNewItemText(event.target.value)}
          placeholder="Add checklist item"
        />
        <Button type="submit" size="icon" variant="outline">
          <Plus className="size-4" />
        </Button>
      </form>
    </div>
  );
}
