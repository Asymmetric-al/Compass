"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchApi } from "@/lib/api/client";

type PrayerItem = {
  id: string;
  text: string;
  status: "open" | "answered" | "closed";
  classification: string;
};

export function PrayerBoard() {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ["prayer-items"],
    queryFn: async () => {
      const payload = await fetchApi<PrayerItem[]>("/api/v1/prayer-items");
      return payload.data ?? [];
    },
  });

  const createPrayerItem = useMutation({
    mutationFn: async () =>
      fetchApi<PrayerItem>("/api/v1/prayer-items", {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
    onSuccess: async () => {
      setText("");
      await queryClient.invalidateQueries({ queryKey: ["prayer-items"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prayer</CardTitle>
        <CardDescription>
          Keep prayer requests visible and connected to ministry priorities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!text.trim()) return;
            createPrayerItem.mutate();
          }}
        >
          <Label htmlFor="prayer-text">Prayer request</Label>
          <Textarea
            id="prayer-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <Button type="submit" disabled={createPrayerItem.isPending}>
            {createPrayerItem.isPending ? "Saving..." : "Add prayer"}
          </Button>
        </form>

        <div className="space-y-2">
          {itemsQuery.data?.map((item) => (
            <div key={item.id} className="rounded-md border p-3">
              <p className="text-sm">{item.text}</p>
              <div className="mt-2 flex gap-2">
                <Badge variant="outline">{item.status}</Badge>
                <Badge variant="secondary">{item.classification}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
