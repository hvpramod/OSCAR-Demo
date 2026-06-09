import { NextRequest, NextResponse } from "next/server";
import { getAPCOrderSummaries, getLatestRun, bulkApproveAll } from "@/lib/orderService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let runId = searchParams.get("runId");

    // Default to latest run if not specified
    if (!runId) {
      const latest = await getLatestRun();
      if (!latest) return NextResponse.json([]);
      runId = latest.id;
    }

    const orders = await getAPCOrderSummaries(runId);
    return NextResponse.json({ runId, orders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Bulk approve all pending
export async function PUT(req: NextRequest) {
  try {
    const { runId } = await req.json();
    if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });
    await bulkApproveAll(runId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
