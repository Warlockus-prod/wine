import { redirect } from "next/navigation";

export default async function RestaurantRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/v1/restaurants/${slug}`);
}
