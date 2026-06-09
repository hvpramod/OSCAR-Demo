import { NextRequest, NextResponse } from "next/server";
import { getUpcomingVisitsByAPC, getKitCatalog } from "@/lib/hawkeyeService";
import {
  createAgentRun, saveKitOrders, completeAgentRun,
} from "@/lib/orderService";
import { DEFAULT_CONFIG } from "@/lib/mockData";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const triggerType = body.triggerType ?? "manual";
    const forecastWindowDays = body.forecastWindowDays ?? DEFAULT_CONFIG.forecastWindowDays;

    // 1. Create agent run record
    const runId = await createAgentRun(triggerType);

    // 2. Fetch upcoming visits from Hawkeye DB
    const apcSummaries = await getUpcomingVisitsByAPC(forecastWindowDays);
    const kitCatalog   = await getKitCatalog();

    if (apcSummaries.length === 0) {
      return NextResponse.json(
        { error: "No APC data found. Run the seed script first." },
        { status: 404 }
      );
    }

    // 3. Run rule engine & save orders
    await saveKitOrders(runId, apcSummaries, kitCatalog, DEFAULT_CONFIG);

    // 4. Calculate totals
    const totalKits = apcSummaries.reduce((sum, apc) => {
      return sum + kitCatalog.reduce((ks, kit) => {
        const forecast = Math.ceil(apc.upcoming_visits * kit.kits_per_visit);
        const buffer   = Math.ceil(forecast * DEFAULT_CONFIG.bufferPct);
        const recommended = Math.min(
          Math.max(forecast + buffer, DEFAULT_CONFIG.minOrderThreshold),
          DEFAULT_CONFIG.maxOrderCap
        );
        return ks + recommended;
      }, 0);
    }, 0);

    // 5. Mark run as completed
    await completeAgentRun(runId, apcSummaries.length, totalKits, apcSummaries.length);

    return NextResponse.json({
      runId,
      apcCount:        apcSummaries.length,
      kitsCalculated:  totalKits,
      ordersGenerated: apcSummaries.length,
      forecastWindowDays,
      status: "completed",
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Agent trigger error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
