import { orderRouteIds } from "@/lib/demo-data";
import { OrderDetailPage } from "@/components/centre/pages/order-detail";

export function generateStaticParams() {
  return orderRouteIds().map((id) => ({ id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailPage displayId={id} />;
}
