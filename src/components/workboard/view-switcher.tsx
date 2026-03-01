"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkboardView } from "@/components/workboard/types";

type ViewSwitcherProps = {
  views: WorkboardView[];
  value: string;
  onValueChange: (nextViewId: string) => void;
};

export function ViewSwitcher({
  views,
  value,
  onValueChange,
}: ViewSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {views.map((view) => (
        <Button
          key={view.id}
          variant={value === view.id ? "default" : "outline"}
          size="sm"
          onClick={() => onValueChange(view.id)}
          className="gap-2"
        >
          {view.name}
          <Badge variant={value === view.id ? "secondary" : "outline"}>
            {view.kind}
          </Badge>
        </Button>
      ))}
    </div>
  );
}
