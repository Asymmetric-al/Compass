import { TeamScoreboard } from "@/components/dashboard/team-scoreboard";

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return <TeamScoreboard teamId={teamId} teamType="department" />;
}
