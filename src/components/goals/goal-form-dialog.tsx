"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GoalFormDialogProps = {
  defaultScope?: "org" | "team" | "user";
  onSubmit: (payload: {
    scopeType: "org" | "team" | "user";
    title: string;
    timeboxType: "annual" | "quarterly" | "monthly" | "weekly" | "custom";
    startDate: string;
    endDate: string;
    visibility: "org" | "team" | "private";
  }) => Promise<unknown> | void;
};

export function GoalFormDialog({
  defaultScope = "user",
  onSubmit,
}: GoalFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [scopeType, setScopeType] = useState<"org" | "team" | "user">(
    defaultScope
  );
  const [title, setTitle] = useState("");
  const [timeboxType, setTimeboxType] = useState<
    "annual" | "quarterly" | "monthly" | "weekly" | "custom"
  >("quarterly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [visibility, setVisibility] = useState<"org" | "team" | "private">(
    defaultScope === "user" ? "private" : "org"
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create goal</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create goal</DialogTitle>
          <DialogDescription>
            Define a measurable objective and connect it to everyday execution.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!title.trim() || !startDate || !endDate) return;
            await onSubmit({
              scopeType,
              title: title.trim(),
              timeboxType,
              startDate,
              endDate,
              visibility,
            });
            setOpen(false);
            setTitle("");
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="goal-title">Title</Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Grow intercession participation by 25%"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Scope</Label>
              <Select
                value={scopeType}
                onValueChange={(value) =>
                  setScopeType(value as "org" | "team" | "user")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org">Org</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="user">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Timebox</Label>
              <Select
                value={timeboxType}
                onValueChange={(value) =>
                  setTimeboxType(
                    value as
                      | "annual"
                      | "quarterly"
                      | "monthly"
                      | "weekly"
                      | "custom"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(value) =>
                  setVisibility(value as "org" | "team" | "private")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org">Org</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="goal-start">Start date</Label>
              <Input
                id="goal-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="goal-end">End date</Label>
              <Input
                id="goal-end"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save goal</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
