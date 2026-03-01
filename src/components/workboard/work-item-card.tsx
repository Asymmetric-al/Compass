"use client";

import { CalendarClock, CheckSquare2, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkboardCard } from "@/components/workboard/types";

type WorkItemCardProps = {
  item: WorkboardCard;
};

const PRIORITY_STYLES: Record<WorkboardCard["priority"], string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  high: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  urgent: "bg-destructive/10 text-destructive",
};

export function WorkItemCard({ item }: WorkItemCardProps) {
  return (
    <Card className="bg-card hover:border-primary/40 cursor-pointer border transition-colors">
      <CardContent className="space-y-3 p-3">
        <div className="space-y-1">
          <p className="line-clamp-2 text-sm leading-tight font-medium">
            {item.title}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            <Badge className={PRIORITY_STYLES[item.priority]}>
              {item.priority}
            </Badge>
            {item.primary_goal ? (
              <Badge variant="outline" className="line-clamp-1">
                Goal: {item.primary_goal.title}
              </Badge>
            ) : (
              <Badge variant="outline">Unlinked</Badge>
            )}
          </div>
        </div>

        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <CheckSquare2 className="size-3.5" />
            {item.checklist.done}/{item.checklist.total}
          </div>
          {item.due_date ? (
            <div className="flex items-center gap-1">
              <CalendarClock className="size-3.5" />
              {item.due_date}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {item.assignees.slice(0, 3).map((assignee) => (
            <Badge key={assignee.user_id} variant="secondary">
              {assignee.full_name}
            </Badge>
          ))}
          {item.tags.labels.slice(0, 2).map((label) => (
            <Badge key={label.label_id} variant="outline" className="gap-1">
              <Tag className="size-3" />
              {label.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
