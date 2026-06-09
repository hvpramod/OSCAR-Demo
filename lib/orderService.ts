/**
 * orderService.ts
 * All READ and WRITE operations against the OSCAR output PostgreSQL tables.
 * Tables: oscar_agent_runs, oscar_kit_orders
 */
import { query, queryOne } from "./db";
import { HawkeyeKitCatalog, APCVisitSummary } from "./hawkeyeService";
import { DEFAULT_CONFIG } from "./mockData";

// ── Types ──────────────────────────────────────────────────────

export interface AgentRun {
  id: string;
  triggered_at: string;
  completed_at: string | null;
  trigger_type: "cron" | "manual" | "data-change";
  forecast_window_days: number;
  buffer_pct: number;
  apc_count: number;
  kits_calculated: number;
  orders_generated: number;
  status: "running" | "completed" | "failed";
}

export interface KitOrderRow {
  id: string;
  run_id: string;
  apc_id: string;
  apc_name: string;
  region: string;
  state: string;
  lab: string;
  manager_name: string;
  manager_email: string;
  kit_id: string;
  kit_name: string;
  category: string;
  upcoming_visits: number;
  kits_per_visit: number;
  forecasted_qty: number;
  buffer_qty: number;
  recommended_qty: number;
  approved_qty: number;
  unit_cost: number;
  line_total: number;
  status: "pending" | "approved" | "modified" | "rejected";
  created_at: string;
}

export interface APCOrderSummary {
  apc_id: string;
  apc_name: string;
  region: string;
  state: string;
  lab: string;
  manager_name: string;
  manager_email: string;
  upcoming_visits: number;
  total_kits: number;
  total_cost: number;
  status: "pending" | "approved" | "modified" | "rejected";
  run_id: string;
}

// ── Engine logic ───────────────────────────────────────────────

export function calculateKitNeed(
  upcomingVisits: number,
  kitsPerVisit: number,
  bufferPct: number,
  minThreshold: number,
  maxCap: number
) {
  const forecasted   = Math.ceil(upcomingVisits * kitsPerVisit);
  const bufferQty    = Math.ceil(forecasted * bufferPct);
  const raw          = forecasted + bufferQty;
  const recommended  = Math.min(Math.max(raw, minThreshold), maxCap);
  return { forecasted, bufferQty, recommended };
}

// ── Agent Run — Save ───────────────────────────────────────────

export async function createAgentRun(
  triggerType: "cron" | "manual" | "data-change"
): Promise<string> {
  const id = `RUN-${Date.now()}`;
  await query(
    `INSERT INTO oscar_agent_runs
       (id, triggered_at, trigger_type, forecast_window_days, buffer_pct,
        apc_count, kits_calculated, orders_generated, status)
     VALUES ($1, NOW(), $2, $3, $4, 0, 0, 0, 'running')`,
    [id, triggerType,
     DEFAULT_CONFIG.forecastWindowDays,
     DEFAULT_CONFIG.bufferPct]
  );
  return id;
}

export async function completeAgentRun(
  runId: string,
  apcCount: number,
  kitsCalculated: number,
  ordersGenerated: number
): Promise<void> {
  await query(
    `UPDATE oscar_agent_runs
     SET completed_at = NOW(),
         apc_count = $2,
         kits_calculated = $3,
         orders_generated = $4,
         status = 'completed'
     WHERE id = $1`,
    [runId, apcCount, kitsCalculated, ordersGenerated]
  );
}

export async function saveKitOrders(
  runId: string,
  apcSummaries: APCVisitSummary[],
  kitCatalog: HawkeyeKitCatalog[],
  config: typeof DEFAULT_CONFIG
): Promise<void> {
  for (const apc of apcSummaries) {
    for (const kit of kitCatalog) {
      const { forecasted, bufferQty, recommended } = calculateKitNeed(
        apc.upcoming_visits,
        kit.kits_per_visit,
        config.bufferPct,
        config.minOrderThreshold,
        config.maxOrderCap
      );
      const lineTotal = recommended * kit.unit_cost;
      const orderId   = `ORD-${runId}-${apc.apc_id}-${kit.kit_id}`;

      await query(
        `INSERT INTO oscar_kit_orders
           (id, run_id, apc_id, kit_id,
            upcoming_visits, kits_per_visit,
            forecasted_qty, buffer_qty, recommended_qty, approved_qty,
            unit_cost, line_total, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11,'pending')
         ON CONFLICT (id) DO NOTHING`,
        [
          orderId, runId, apc.apc_id, kit.kit_id,
          apc.upcoming_visits, kit.kits_per_visit,
          forecasted, bufferQty, recommended,
          kit.unit_cost, lineTotal,
        ]
      );
    }
  }
}

// ── Reads ──────────────────────────────────────────────────────

export async function getLatestRun(): Promise<AgentRun | null> {
  return queryOne<AgentRun>(
    `SELECT * FROM oscar_agent_runs ORDER BY triggered_at DESC LIMIT 1`
  );
}

export async function getRecentRuns(limit = 5): Promise<AgentRun[]> {
  return query<AgentRun>(
    `SELECT * FROM oscar_agent_runs ORDER BY triggered_at DESC LIMIT $1`,
    [limit]
  );
}

export async function getAPCOrderSummaries(runId: string): Promise<APCOrderSummary[]> {
  return query<APCOrderSummary>(
    `SELECT
       o.apc_id,
       a.name          AS apc_name,
       a.region,
       a.state,
       a.lab,
       a.manager_name,
       a.manager_email,
       MAX(o.upcoming_visits)::int        AS upcoming_visits,
       SUM(o.approved_qty)::int           AS total_kits,
       ROUND(SUM(o.line_total)::numeric, 2)::float AS total_cost,
       CASE
         WHEN bool_or(o.status = 'rejected')  THEN 'rejected'
         WHEN bool_or(o.status = 'modified')  THEN 'modified'
         WHEN bool_and(o.status = 'approved') THEN 'approved'
         ELSE 'pending'
       END AS status,
       o.run_id
     FROM oscar_kit_orders o
     JOIN hawkeye_apcs a ON a.id = o.apc_id
     WHERE o.run_id = $1
     GROUP BY o.apc_id, a.name, a.region, a.state, a.lab,
              a.manager_name, a.manager_email, o.run_id
     ORDER BY a.name`,
    [runId]
  );
}

export async function getKitOrdersForAPC(
  runId: string,
  apcId: string
): Promise<KitOrderRow[]> {
  return query<KitOrderRow>(
    `SELECT
       o.*,
       a.name   AS apc_name,
       a.region, a.state, a.lab,
       a.manager_name, a.manager_email,
       k.kit_name, k.category,
       o.kits_per_visit::float,
       o.unit_cost::float,
       o.line_total::float
     FROM oscar_kit_orders o
     JOIN hawkeye_apcs       a ON a.id = o.apc_id
     JOIN hawkeye_kit_catalog k ON k.kit_id = o.kit_id
     WHERE o.run_id = $1 AND o.apc_id = $2
     ORDER BY k.category, k.kit_name`,
    [runId, apcId]
  );
}

// ── Update order quantities & status ──────────────────────────

export async function approveAPCOrder(
  runId: string,
  apcId: string
): Promise<void> {
  await query(
    `UPDATE oscar_kit_orders
     SET status = 'approved'
     WHERE run_id = $1 AND apc_id = $2`,
    [runId, apcId]
  );
}

export async function rejectAPCOrder(
  runId: string,
  apcId: string
): Promise<void> {
  await query(
    `UPDATE oscar_kit_orders
     SET status = 'rejected'
     WHERE run_id = $1 AND apc_id = $2`,
    [runId, apcId]
  );
}

export async function updateKitQty(
  runId: string,
  apcId: string,
  kitId: string,
  approvedQty: number
): Promise<void> {
  const lineTotal = await queryOne<{ unit_cost: number }>(
    `SELECT unit_cost::float FROM oscar_kit_orders
     WHERE run_id=$1 AND apc_id=$2 AND kit_id=$3`,
    [runId, apcId, kitId]
  );
  const newLineTotal = approvedQty * (lineTotal?.unit_cost ?? 0);
  await query(
    `UPDATE oscar_kit_orders
     SET approved_qty = $4,
         line_total   = $5,
         status       = 'modified'
     WHERE run_id=$1 AND apc_id=$2 AND kit_id=$3`,
    [runId, apcId, kitId, approvedQty, newLineTotal]
  );
}

export async function bulkApproveAll(runId: string): Promise<void> {
  await query(
    `UPDATE oscar_kit_orders SET status = 'approved'
     WHERE run_id = $1 AND status = 'pending'`,
    [runId]
  );
}
