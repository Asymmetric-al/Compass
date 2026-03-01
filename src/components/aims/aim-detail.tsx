"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchApi } from "@/lib/api/client";

type AimRecord = {
  id: string;
  title: string;
  scope: string;
  why_this_matters: string | null;
  classification: string;
};

type MeasureRecord = {
  id: string;
  name: string;
  kind: "lead" | "lag" | "health" | "learning";
  cadence: string;
};

export function AimDetail({ aimId }: { aimId: string }) {
  const aimQuery = useQuery({
    queryKey: ["aim", aimId],
    queryFn: async () => {
      const payload = await fetchApi<AimRecord[]>("/api/v1/aims");
      return (payload.data ?? []).filter((aim) => aim.id === aimId);
    },
  });

  const measuresQuery = useQuery({
    queryKey: ["aim-measures", aimId],
    queryFn: async () => {
      const payload = await fetchApi<MeasureRecord[]>(
        `/api/v1/measures?aimId=${aimId}`
      );
      return payload.data ?? [];
    },
  });

  const leadMeasures = (measuresQuery.data ?? []).filter(
    (measure) => measure.kind === "lead"
  );
  const lagMeasures = (measuresQuery.data ?? []).filter(
    (measure) => measure.kind === "lag"
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Aim details</CardTitle>
          <CardDescription>
            Lead stewardship measures are shown before lag fruit measures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(aimQuery.data ?? []).map((aim) => (
            <div key={aim.id} className="rounded-md border p-3">
              <p className="text-sm font-semibold">{aim.title}</p>
              <p className="text-muted-foreground text-xs">
                {aim.why_this_matters ?? ""}
              </p>
              <Badge variant="outline" className="mt-2">
                {aim.classification}
              </Badge>
            </div>
          ))}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-3">
              <p className="mb-2 text-sm font-semibold">Lead measures</p>
              <ul className="space-y-1 text-sm">
                {leadMeasures.map((measure) => (
                  <li key={measure.id}>
                    {measure.name} ·{" "}
                    <span className="text-muted-foreground">
                      {measure.cadence}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border p-3">
              <p className="mb-2 text-sm font-semibold">Lag measures</p>
              <ul className="space-y-1 text-sm">
                {lagMeasures.map((measure) => (
                  <li key={measure.id}>
                    {measure.name} ·{" "}
                    <span className="text-muted-foreground">
                      {measure.cadence}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
