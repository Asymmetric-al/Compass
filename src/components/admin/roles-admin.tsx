"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchApi } from "@/lib/api/client";

type RoleRecord = {
  id: string;
  user_id: string;
  role: string;
  team_id: string | null;
};

export function RolesAdmin() {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("staff");
  const [teamId, setTeamId] = useState("");
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const payload = await fetchApi<RoleRecord[]>("/api/v1/roles");
      return payload.data ?? [];
    },
  });

  const assignRole = useMutation({
    mutationFn: async () =>
      fetchApi<RoleRecord>("/api/v1/roles", {
        method: "POST",
        body: JSON.stringify({
          userId,
          role,
          teamId: teamId || null,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role assignments</CardTitle>
        <CardDescription>
          Assign organization and team-scoped roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            assignRole.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="role-user-id">User ID</Label>
            <Input
              id="role-user-id"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="co_ed">co_ed</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="staff">staff</SelectItem>
                <SelectItem value="department_director">
                  department_director
                </SelectItem>
                <SelectItem value="department_staff">
                  department_staff
                </SelectItem>
                <SelectItem value="regional_director">
                  regional_director
                </SelectItem>
                <SelectItem value="regional_staff">regional_staff</SelectItem>
                <SelectItem value="read_only">read_only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-team-id">Team ID (optional)</Label>
            <Input
              id="role-team-id"
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={assignRole.isPending}>
              {assignRole.isPending ? "Assigning..." : "Assign role"}
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          {rolesQuery.data?.map((assignment) => (
            <div key={assignment.id} className="rounded-md border p-3 text-sm">
              {assignment.user_id} · {assignment.role}
              {assignment.team_id ? ` · ${assignment.team_id}` : " · org-scope"}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
