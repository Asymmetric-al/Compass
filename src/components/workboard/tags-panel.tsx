"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type TagsPanelProps = {
  tags: {
    teamIds: string[];
    missionaryIds: string[];
    labelIds: string[];
  };
  available: {
    teams: Array<{ id: string; name: string }>;
    missionaries: Array<{ id: string; name: string }>;
    labels: Array<{ id: string; name: string }>;
  };
  onSave: (payload: {
    teamIds: string[];
    missionaryIds: string[];
    labelIds: string[];
  }) => Promise<unknown> | void;
};

export function TagsPanel({ tags, available, onSave }: TagsPanelProps) {
  function toggleTag({
    kind,
    id,
  }: {
    kind: "team" | "missionary" | "label";
    id: string;
  }) {
    const nextTeamIds = new Set(tags.teamIds);
    const nextMissionaryIds = new Set(tags.missionaryIds);
    const nextLabelIds = new Set(tags.labelIds);

    if (kind === "team") {
      if (nextTeamIds.has(id)) nextTeamIds.delete(id);
      else nextTeamIds.add(id);
    }
    if (kind === "missionary") {
      if (nextMissionaryIds.has(id)) nextMissionaryIds.delete(id);
      else nextMissionaryIds.add(id);
    }
    if (kind === "label") {
      if (nextLabelIds.has(id)) nextLabelIds.delete(id);
      else nextLabelIds.add(id);
    }

    onSave({
      teamIds: Array.from(nextTeamIds),
      missionaryIds: Array.from(nextMissionaryIds),
      labelIds: Array.from(nextLabelIds),
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Tags</h3>
      <div className="space-y-2">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Label tags</p>
          <div className="flex flex-wrap gap-1">
            {available.labels.length ? (
              available.labels.map((label) => (
                <label
                  key={label.id}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs"
                >
                  <Checkbox
                    checked={tags.labelIds.includes(label.id)}
                    onCheckedChange={() =>
                      toggleTag({ kind: "label", id: label.id })
                    }
                  />
                  <Badge variant="outline">{label.name}</Badge>
                </label>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">
                No labels available.
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs">Team tags</p>
        <div className="flex flex-wrap gap-1">
          {available.teams.length ? (
            available.teams.map((team) => (
              <label
                key={team.id}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs"
              >
                <Checkbox
                  checked={tags.teamIds.includes(team.id)}
                  onCheckedChange={() =>
                    toggleTag({ kind: "team", id: team.id })
                  }
                />
                <span>{team.name}</span>
              </label>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">
              No teams available.
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs">Missionary tags</p>
        <div className="flex flex-wrap gap-1">
          {available.missionaries.length ? (
            available.missionaries.map((missionary) => (
              <label
                key={missionary.id}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs"
              >
                <Checkbox
                  checked={tags.missionaryIds.includes(missionary.id)}
                  onCheckedChange={() =>
                    toggleTag({ kind: "missionary", id: missionary.id })
                  }
                />
                <span>{missionary.name}</span>
              </label>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">
              No missionaries available.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
