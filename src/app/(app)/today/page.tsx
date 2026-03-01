import { TodayBoard } from "@/components/commitments/today-board";
import { WorkboardPage } from "@/components/workboard/workboard-page";
import { isGoalsWorkboardV2Enabled } from "@/lib/feature-flags";

export default function TodayPage() {
  if (!isGoalsWorkboardV2Enabled()) {
    return <TodayBoard />;
  }

  return (
    <WorkboardPage
      preferredBoardType="user"
      heading="Today"
      description="Your personal execution lane powered by the Workboard."
    />
  );
}
