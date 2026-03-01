"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchApi } from "@/lib/api/client";

type StoryRecord = {
  id: string;
  title: string;
  type: "quick" | "msc_candidate";
  body_json: { text?: string };
  classification: string;
};

export function StoriesBoard() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  const storiesQuery = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const payload = await fetchApi<StoryRecord[]>("/api/v1/stories");
      return payload.data ?? [];
    },
  });

  const createStory = useMutation({
    mutationFn: async () =>
      fetchApi<StoryRecord>("/api/v1/stories", {
        method: "POST",
        body: JSON.stringify({
          title,
          type: "quick",
          bodyJson: { text: body },
        }),
      }),
    onSuccess: async () => {
      setTitle("");
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stories</CardTitle>
        <CardDescription>
          Capture what God is doing through simple narrative updates and MSC
          candidates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            createStory.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="story-title">Story title</Label>
            <Input
              id="story-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="story-body">Story details</Label>
            <Textarea
              id="story-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={createStory.isPending}>
            {createStory.isPending ? "Saving..." : "Save story"}
          </Button>
        </form>

        {storiesQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading stories...
          </div>
        ) : null}

        {storiesQuery.isError ? (
          <p className="text-destructive text-sm">
            {(storiesQuery.error as Error).message}
          </p>
        ) : null}

        {createStory.isError ? (
          <p className="text-destructive text-sm">
            {(createStory.error as Error).message}
          </p>
        ) : null}

        <div className="space-y-2">
          {storiesQuery.data?.map((story) => (
            <div key={story.id} className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{story.title}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{story.type}</Badge>
                  <Badge variant="secondary">{story.classification}</Badge>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                {story.body_json?.text ?? ""}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
