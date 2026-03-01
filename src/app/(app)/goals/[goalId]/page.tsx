import { GoalDetail } from "@/components/goals/goal-detail";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ goalId: string }>;
}) {
  const { goalId } = await params;
  return <GoalDetail goalId={goalId} />;
}
