import { redirect } from "next/navigation";

import { isGoalsWorkboardV2Enabled } from "@/lib/feature-flags";

export default function GoalsIndexPage() {
  if (!isGoalsWorkboardV2Enabled()) {
    redirect("/aims");
  }
  redirect("/goals/my");
}
