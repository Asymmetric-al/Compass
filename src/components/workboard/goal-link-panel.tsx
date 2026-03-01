"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GoalLink = {
  goal_id: string;
  is_primary: boolean;
};

type GoalOption = {
  id: string;
  title: string;
};

type GoalLinkPanelProps = {
  links: GoalLink[];
  availableGoals: GoalOption[];
  onAdd: (goalId: string, isPrimary: boolean) => Promise<unknown> | void;
  onRemove: (goalId: string) => Promise<unknown> | void;
};

export function GoalLinkPanel({
  links,
  availableGoals,
  onAdd,
  onRemove,
}: GoalLinkPanelProps) {
  const [goalId, setGoalId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const goalNameById = new Map(
    availableGoals.map((goal) => [goal.id, goal.title])
  );
  const linkedGoalIds = new Set(links.map((link) => link.goal_id));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Goal links</h3>
      <div className="space-y-2">
        {links.length ? (
          links.map((link) => (
            <div
              key={link.goal_id}
              className="flex items-center justify-between rounded-md border p-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span>{goalNameById.get(link.goal_id) ?? link.goal_id}</span>
                {link.is_primary ? <Badge>Primary</Badge> : null}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(link.goal_id)}
              >
                Remove
              </Button>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-xs">No linked goals.</p>
        )}
      </div>
      <div className="space-y-2">
        <Select value={goalId} onValueChange={setGoalId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a goal to link" />
          </SelectTrigger>
          <SelectContent>
            {availableGoals
              .filter((goal) => !linkedGoalIds.has(goal.id))
              .map((goal) => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <label className="text-muted-foreground flex items-center gap-2 text-xs">
          <Checkbox
            checked={isPrimary}
            onCheckedChange={(checked) => setIsPrimary(Boolean(checked))}
          />
          Set as primary link
        </label>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            if (!goalId.trim()) return;
            onAdd(goalId.trim(), isPrimary);
            setGoalId("");
            setIsPrimary(false);
          }}
        >
          Link goal
        </Button>
      </div>
    </div>
  );
}
