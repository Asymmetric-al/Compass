"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchApi } from "@/lib/api/client";

type AimNode = {
  id: string;
  title: string;
  scope: "org" | "team" | "user";
  parent_aim_id: string | null;
};

export function ConnectionsMap() {
  const aimsQuery = useQuery({
    queryKey: ["connections-map", "aims"],
    queryFn: async () => {
      const payload = await fetchApi<AimNode[]>("/api/v1/aims");
      return payload.data ?? [];
    },
  });

  const roots = (aimsQuery.data ?? []).filter((aim) => !aim.parent_aim_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connections Map</CardTitle>
        <CardDescription>
          Org aims connect to department, region, and personal aims.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {roots.map((root) => {
          const children = (aimsQuery.data ?? []).filter(
            (aim) => aim.parent_aim_id === root.id
          );

          return (
            <div key={root.id} className="rounded-md border p-3">
              <p className="text-sm font-semibold">{root.title}</p>
              <p className="text-muted-foreground text-xs">{root.scope} aim</p>
              {children.length > 0 ? (
                <ul className="mt-2 space-y-1 pl-3">
                  {children.map((child) => (
                    <li key={child.id} className="text-sm">
                      ↳ {child.title}{" "}
                      <span className="text-muted-foreground">
                        ({child.scope})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
