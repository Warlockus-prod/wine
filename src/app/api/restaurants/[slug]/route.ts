import { NextResponse } from "next/server";
import { resolveRestaurantBySlug } from "@/lib/db-restaurants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { data, source } = await resolveRestaurantBySlug(slug);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(
    { data, source },
    { headers: { "Cache-Control": "no-store" } },
  );
}
