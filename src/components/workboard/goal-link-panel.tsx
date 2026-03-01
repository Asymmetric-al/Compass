"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GoalLink = {
  goal_id: string;
  is_primary: boolean;
};

type GoalLinkPanelProps = {
  links: GoalLink[];
  onAdd: (goalId: string, isPrimary: boolean) => Promise<unknown> | void;
  onRemove: (goalId: string) => Promise<unknown> | void;
};

export function GoalLinkPanel({ links, onAdd, onRemove }: GoalLinkPanelProps) {
  const [goalId, setGoalId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

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
                <span className="font-mono">{link.goal_id}</span>
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
        <Input
          value={goalId}
          onChange={(event) => setGoalId(event.target.value)}
          placeholder="Goal ID"
        />
        <label className="text-muted-foreground flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(event) => setIsPrimary(event.target.checked)}
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
