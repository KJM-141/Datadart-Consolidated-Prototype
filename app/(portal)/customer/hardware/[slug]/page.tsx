import { notFound } from "next/navigation";
import { getProduct, PRODUCTS } from "@/lib/products";
import { ProductPage } from "@/components/centre/pages/product-page";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductPage product={product} />;
}
