import { MissionaryUpdatesBoard } from "@/components/missionaries/missionary-updates-board";

export default async function MissionaryDetailsPage({
  params,
}: {
  params: Promise<{ missionaryId: string }>;
}) {
  const { missionaryId } = await params;
  return <MissionaryUpdatesBoard missionaryId={missionaryId} />;
}
