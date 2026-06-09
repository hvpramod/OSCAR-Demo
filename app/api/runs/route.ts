import { NextResponse } from "next/server";
import { getRecentRuns } from "@/lib/orderService";

export async function GET() {
  try {
    const runs = await getRecentRuns(10);
    return NextResponse.json(runs);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
