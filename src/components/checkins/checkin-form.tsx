"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

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

function mondayOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = (day + 6) % 7;
  now.setDate(now.getDate() - diff);
  return now.toISOString().slice(0, 10);
}

export function CheckInForm() {
  const [highlights, setHighlights] = useState("");
  const [progress, setProgress] = useState("");
  const [blockers, setBlockers] = useState("");
  const [asks, setAsks] = useState("");
  const [prayer, setPrayer] = useState("");

  const submitCheckin = useMutation({
    mutationFn: async () =>
      fetchApi("/api/v1/checkins", {
        method: "POST",
        body: JSON.stringify({
          weekStart: mondayOfCurrentWeek(),
          highlightsJson: { text: highlights },
          progressJson: { text: progress },
          blockersJson: { text: blockers },
          asksJson: { text: asks },
          prayerJson: { text: prayer },
          nextWeekJson: {},
        }),
      }),
    onSuccess: () => {
      setHighlights("");
      setProgress("");
      setBlockers("");
      setAsks("");
      setPrayer("");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Check-in</CardTitle>
        <CardDescription>
          Share what mattered most, where you&apos;re blocked, and how the team
          can pray.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="highlights">
            What did you complete that mattered most?
          </Label>
          <Textarea
            id="highlights"
            value={highlights}
            onChange={(event) => setHighlights(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="progress">What moved in your lead measures?</Label>
          <Textarea
            id="progress"
            value={progress}
            onChange={(event) => setProgress(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="blockers">Where are you stuck?</Label>
          <Textarea
            id="blockers"
            value={blockers}
            onChange={(event) => setBlockers(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="asks">What do you need from the team?</Label>
          <Textarea
            id="asks"
            value={asks}
            onChange={(event) => setAsks(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prayer">What are you asking God to do?</Label>
          <Textarea
            id="prayer"
            value={prayer}
            onChange={(event) => setPrayer(event.target.value)}
          />
        </div>

        {submitCheckin.isError ? (
          <p className="text-destructive text-sm">
            {(submitCheckin.error as Error).message}
          </p>
        ) : null}

        <Button
          onClick={() => submitCheckin.mutate()}
          disabled={submitCheckin.isPending}
          className="w-full"
        >
          {submitCheckin.isPending ? "Submitting..." : "Submit check-in"}
        </Button>
      </CardContent>
    </Card>
  );
}
