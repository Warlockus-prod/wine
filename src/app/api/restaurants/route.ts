import { NextResponse } from "next/server";
import { resolveRestaurants } from "@/lib/db-restaurants";

export const runtime = "nodejs";
// No cache — admin edits should be visible immediately. Per-request fetch.
export const dynamic = "force-dynamic";

export async function GET() {
  const { data, source } = await resolveRestaurants();
  return NextResponse.json(
    { data, source, count: data.length },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
