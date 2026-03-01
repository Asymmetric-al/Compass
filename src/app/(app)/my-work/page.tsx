import { TodayBoard } from "@/components/commitments/today-board";
import { WorkboardPage } from "@/components/workboard/workboard-page";
import { isGoalsWorkboardV2Enabled } from "@/lib/feature-flags";

export default function MyWorkPage() {
  if (!isGoalsWorkboardV2Enabled()) {
    return <TodayBoard />;
  }

  return (
    <WorkboardPage
      preferredBoardType="user"
      heading="My Workboard"
      description="Plan, prioritize, and execute your responsibilities in one place."
    />
  );
}
