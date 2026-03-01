import { WorkboardPage } from "@/components/workboard/workboard-page";
import { isGoalsWorkboardV2Enabled } from "@/lib/feature-flags";
import { redirect } from "next/navigation";

export default function WorkboardRoutePage() {
  if (!isGoalsWorkboardV2Enabled()) {
    redirect("/today");
  }

  return <WorkboardPage />;
}
