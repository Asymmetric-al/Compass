import { GoalsPage } from "@/components/goals/goals-page";
import { isGoalsWorkboardV2Enabled } from "@/lib/feature-flags";
import { redirect } from "next/navigation";

export default function MyGoalsPage() {
  if (!isGoalsWorkboardV2Enabled()) {
    redirect("/aims");
  }
  return <GoalsPage tab="my" />;
}
