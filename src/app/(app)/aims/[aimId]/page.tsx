import { AimDetail } from "@/components/aims/aim-detail";

export default async function AimDetailPage({
  params,
}: {
  params: Promise<{ aimId: string }>;
}) {
  const { aimId } = await params;
  return <AimDetail aimId={aimId} />;
}
