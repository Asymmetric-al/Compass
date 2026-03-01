import { WorkboardPage } from "@/components/workboard/workboard-page";

export default function TodayPage() {
  return (
    <WorkboardPage
      preferredBoardType="user"
      heading="Today"
      description="Your personal execution lane powered by the Workboard."
    />
  );
}
