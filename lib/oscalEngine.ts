import { APC, KitOrder, DEFAULT_CONFIG } from "./mockData";

export interface EngineConfig {
  forecastWindowDays: number;
  bufferPct: number;
  minOrderThreshold: number;
  maxOrderCap: number;
  autoApproveUnder: number;
}

export function calculateKitNeed(
  upcomingVisits: number,
  kitsPerVisit: number,
  config: EngineConfig
): { forecasted: number; bufferQty: number; recommended: number } {
  const forecasted = Math.ceil(upcomingVisits * kitsPerVisit);
  const bufferQty  = Math.ceil(forecasted * config.bufferPct);
  const raw        = forecasted + bufferQty;
  const recommended = Math.min(Math.max(raw, config.minOrderThreshold), config.maxOrderCap);
  return { forecasted, bufferQty, recommended };
}

export function recalculateAPC(apc: APC, config: EngineConfig): APC {
  const updatedKits: KitOrder[] = apc.kits.map((kit) => {
    const { forecasted, bufferQty, recommended } = calculateKitNeed(
      apc.upcomingVisits,
      kit.kitsPerVisit,
      config
    );
    return { ...kit, forecasted, bufferQty, recommended, approved: recommended };
  });
  const totalCost = updatedKits.reduce((sum, k) => sum + k.recommended * k.unitCost, 0);
  return { ...apc, kits: updatedKits, totalCost };
}

export function buildOrderPayload(apc: APC) {
  return {
    orderId: `ORD-${apc.id}-${Date.now()}`,
    apcId: apc.id,
    apcName: apc.name,
    region: apc.region,
    lab: apc.lab,
    manager: apc.manager,
    generatedAt: new Date().toISOString(),
    forecastWindowDays: DEFAULT_CONFIG.forecastWindowDays,
    upcomingVisits: apc.upcomingVisits,
    lineItems: apc.kits.map((k) => ({
      kitId: k.kitId,
      kitName: k.kitName,
      category: k.category,
      quantity: k.approved ?? k.recommended,
      unitCost: k.unitCost,
      lineTotal: ((k.approved ?? k.recommended) * k.unitCost).toFixed(2),
    })),
    totalCost: apc.kits
      .reduce((sum, k) => sum + (k.approved ?? k.recommended) * k.unitCost, 0)
      .toFixed(2),
    status: apc.status,
    erpEndpoint: DEFAULT_CONFIG.erpEndpoint,
  };
}

export function exportJSON(apc: APC): void {
  const payload = buildOrderPayload(apc);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `OSCAR_Order_${apc.id}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
