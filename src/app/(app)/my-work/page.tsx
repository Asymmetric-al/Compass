import { WorkboardPage } from "@/components/workboard/workboard-page";

export default function MyWorkPage() {
  return (
    <WorkboardPage
      preferredBoardType="user"
      heading="My Workboard"
      description="Plan, prioritize, and execute your responsibilities in one place."
    />
  );
}
