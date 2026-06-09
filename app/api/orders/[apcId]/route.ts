import { NextRequest, NextResponse } from "next/server";
import {
  getKitOrdersForAPC, approveAPCOrder,
  rejectAPCOrder, updateKitQty, getLatestRun,
} from "@/lib/orderService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ apcId: string }> }
) {
  try {
    const { apcId } = await params;
    const { searchParams } = new URL(req.url);
    let runId = searchParams.get("runId");

    if (!runId) {
      const latest = await getLatestRun();
      if (!latest) return NextResponse.json([]);
      runId = latest.id;
    }

    const orders = await getKitOrdersForAPC(runId, apcId);
    return NextResponse.json({ runId, orders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ apcId: string }> }
) {
  try {
    const { apcId } = await params;
    const body = await req.json();
    const { runId, action, kitId, approvedQty } = body;

    if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

    if (action === "approve") {
      await approveAPCOrder(runId, apcId);
    } else if (action === "reject") {
      await rejectAPCOrder(runId, apcId);
    } else if (action === "update_qty" && kitId !== undefined && approvedQty !== undefined) {
      await updateKitQty(runId, apcId, kitId, approvedQty);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
