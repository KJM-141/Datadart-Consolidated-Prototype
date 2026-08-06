import { orderRouteIds } from "@/lib/demo-data";
import { AgreementAdvanced } from "@/components/advanced/pages/agreement";

export function generateStaticParams() {
  return orderRouteIds().map((id) => ({ id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AgreementAdvanced displayId={id} />;
}
