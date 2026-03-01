"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TagsPanelProps = {
  tags: {
    teams: Array<{ team_id: string; name: string }>;
    missionaries: Array<{ missionary_id: string; name: string }>;
    labels: Array<{ label_id: string; name: string }>;
  };
  onSave: (payload: {
    teamIds: string[];
    missionaryIds: string[];
    labelIds: string[];
  }) => Promise<unknown> | void;
};

function parseCsv(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function TagsPanel({ tags, onSave }: TagsPanelProps) {
  const [teamIdsRaw, setTeamIdsRaw] = useState("");
  const [missionaryIdsRaw, setMissionaryIdsRaw] = useState("");
  const [labelIdsRaw, setLabelIdsRaw] = useState("");

  const current = useMemo(
    () => ({
      teams: tags.teams.map((tag) => tag.team_id),
      missionaries: tags.missionaries.map((tag) => tag.missionary_id),
      labels: tags.labels.map((tag) => tag.label_id),
    }),
    [tags]
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Tags</h3>
      <div className="space-y-2">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Current labels</p>
          <div className="flex flex-wrap gap-1">
            {tags.labels.length ? (
              tags.labels.map((label) => (
                <Badge key={label.label_id} variant="outline">
                  {label.name}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">No labels</span>
            )}
          </div>
        </div>

        <Input
          placeholder="Team IDs (comma separated)"
          value={teamIdsRaw}
          onChange={(event) => setTeamIdsRaw(event.target.value)}
        />
        <Input
          placeholder="Missionary IDs (comma separated)"
          value={missionaryIdsRaw}
          onChange={(event) => setMissionaryIdsRaw(event.target.value)}
        />
        <Input
          placeholder="Label IDs (comma separated)"
          value={labelIdsRaw}
          onChange={(event) => setLabelIdsRaw(event.target.value)}
        />
      </div>
      <Button
        variant="outline"
        onClick={() =>
          onSave({
            teamIds: teamIdsRaw ? parseCsv(teamIdsRaw) : current.teams,
            missionaryIds: missionaryIdsRaw
              ? parseCsv(missionaryIdsRaw)
              : current.missionaries,
            labelIds: labelIdsRaw ? parseCsv(labelIdsRaw) : current.labels,
          })
        }
      >
        Save tags
      </Button>
    </div>
  );
}
