import { GoalDetail } from "@/components/goals/goal-detail";
import { isGoalsWorkboardV2Enabled } from "@/lib/feature-flags";
import { redirect } from "next/navigation";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ goalId: string }>;
}) {
  if (!isGoalsWorkboardV2Enabled()) {
    redirect("/aims");
  }
  const { goalId } = await params;
  return <GoalDetail goalId={goalId} />;
}
