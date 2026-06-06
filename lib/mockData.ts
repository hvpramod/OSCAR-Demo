export interface KitType {
  kitId: string;
  kitName: string;
  category: string;
  kitsPerVisit: number;
  unitCost: number;
}

export interface KitOrder {
  kitId: string;
  kitName: string;
  category: string;
  visitsRequiring: number;
  kitsPerVisit: number;
  forecasted: number;
  bufferQty: number;
  recommended: number;
  approved?: number;
  unitCost: number;
}

export interface APC {
  id: string;
  name: string;
  region: string;
  state: string;
  lab: string;
  manager: string;
  email: string;
  upcomingVisits: number;
  currentStock: number;
  kits: KitOrder[];
  status: "pending" | "approved" | "modified" | "rejected";
  lastOrderDate: string;
  totalCost?: number;
}

export interface AgentRun {
  id: string;
  triggeredAt: string;
  completedAt: string;
  apcCount: number;
  kitsCalculated: number;
  ordersGenerated: number;
  trigger: "cron" | "manual" | "data-change";
  status: "completed" | "running" | "failed";
}

export const KIT_CATALOG: KitType[] = [
  { kitId: "KIT-001", kitName: "CBC Lab Kit",           category: "Lab",         kitsPerVisit: 1.0, unitCost: 4.25 },
  { kitId: "KIT-002", kitName: "HbA1c Kit",             category: "Lab",         kitsPerVisit: 0.6, unitCost: 6.10 },
  { kitId: "KIT-003", kitName: "Lipid Panel Kit",       category: "Lab",         kitsPerVisit: 0.5, unitCost: 5.80 },
  { kitId: "KIT-004", kitName: "Urinalysis Kit",        category: "Lab",         kitsPerVisit: 0.4, unitCost: 3.50 },
  { kitId: "KIT-005", kitName: "INR/PT Kit",            category: "Lab",         kitsPerVisit: 0.3, unitCost: 7.20 },
  { kitId: "KIT-006", kitName: "Referral Form Packet",  category: "Print",       kitsPerVisit: 1.0, unitCost: 0.35 },
  { kitId: "KIT-007", kitName: "Care Plan Booklet",     category: "Print",       kitsPerVisit: 1.0, unitCost: 1.20 },
  { kitId: "KIT-008", kitName: "Wound Care Kit",        category: "Clinical",    kitsPerVisit: 0.2, unitCost: 12.40 },
  { kitId: "KIT-009", kitName: "Blood Pressure Cuff",   category: "Equipment",   kitsPerVisit: 0.1, unitCost: 28.00 },
  { kitId: "KIT-010", kitName: "Flu Vaccine Kit",       category: "Vaccine",     kitsPerVisit: 0.8, unitCost: 15.60 },
];

const LABS = ["Quest Diagnostics", "LabCorp", "BioReference", "Sonic Healthcare", "ARUP Laboratories"];
const REGIONS = ["Southwest", "Southeast", "Midwest", "Northeast", "Northwest", "South Central"];

const APC_RAW = [
  { name: "Phoenix West",       state: "AZ", region: "Southwest",    visits: 48, lab: 0 },
  { name: "Phoenix East",       state: "AZ", region: "Southwest",    visits: 52, lab: 0 },
  { name: "Scottsdale North",   state: "AZ", region: "Southwest",    visits: 37, lab: 0 },
  { name: "Tucson Central",     state: "AZ", region: "Southwest",    visits: 44, lab: 1 },
  { name: "Mesa Valley",        state: "AZ", region: "Southwest",    visits: 31, lab: 1 },
  { name: "Dallas North",       state: "TX", region: "South Central", visits: 61, lab: 0 },
  { name: "Dallas South",       state: "TX", region: "South Central", visits: 55, lab: 0 },
  { name: "Houston Heights",    state: "TX", region: "South Central", visits: 72, lab: 1 },
  { name: "Houston Galleria",   state: "TX", region: "South Central", visits: 68, lab: 1 },
  { name: "Austin Central",     state: "TX", region: "South Central", visits: 43, lab: 2 },
  { name: "San Antonio West",   state: "TX", region: "South Central", visits: 39, lab: 2 },
  { name: "Minneapolis East",   state: "MN", region: "Midwest",       visits: 35, lab: 3 },
  { name: "Minneapolis West",   state: "MN", region: "Midwest",       visits: 41, lab: 3 },
  { name: "St. Paul Central",   state: "MN", region: "Midwest",       visits: 28, lab: 3 },
  { name: "Chicago North Shore",state: "IL", region: "Midwest",       visits: 58, lab: 0 },
  { name: "Chicago West Loop",  state: "IL", region: "Midwest",       visits: 63, lab: 0 },
  { name: "Chicago South Side", state: "IL", region: "Midwest",       visits: 49, lab: 1 },
  { name: "Detroit Metro",      state: "MI", region: "Midwest",       visits: 45, lab: 4 },
  { name: "Columbus Central",   state: "OH", region: "Midwest",       visits: 33, lab: 4 },
  { name: "Cleveland Heights",  state: "OH", region: "Midwest",       visits: 38, lab: 4 },
  { name: "New York Bronx",     state: "NY", region: "Northeast",     visits: 82, lab: 1 },
  { name: "New York Brooklyn",  state: "NY", region: "Northeast",     visits: 76, lab: 1 },
  { name: "New York Queens",    state: "NY", region: "Northeast",     visits: 69, lab: 0 },
  { name: "New York Manhattan", state: "NY", region: "Northeast",     visits: 91, lab: 0 },
  { name: "Boston Back Bay",    state: "MA", region: "Northeast",     visits: 54, lab: 2 },
  { name: "Boston South End",   state: "MA", region: "Northeast",     visits: 47, lab: 2 },
  { name: "Philadelphia North", state: "PA", region: "Northeast",     visits: 58, lab: 3 },
  { name: "Philadelphia South", state: "PA", region: "Northeast",     visits: 51, lab: 3 },
  { name: "Newark Central",     state: "NJ", region: "Northeast",     visits: 43, lab: 1 },
  { name: "Hartford Metro",     state: "CT", region: "Northeast",     visits: 29, lab: 2 },
  { name: "Atlanta Buckhead",   state: "GA", region: "Southeast",     visits: 57, lab: 0 },
  { name: "Atlanta Midtown",    state: "GA", region: "Southeast",     visits: 62, lab: 0 },
  { name: "Atlanta South",      state: "GA", region: "Southeast",     visits: 44, lab: 1 },
  { name: "Miami Beach",        state: "FL", region: "Southeast",     visits: 71, lab: 2 },
  { name: "Miami Doral",        state: "FL", region: "Southeast",     visits: 65, lab: 2 },
  { name: "Orlando Central",    state: "FL", region: "Southeast",     visits: 53, lab: 3 },
  { name: "Tampa Bay",          state: "FL", region: "Southeast",     visits: 48, lab: 3 },
  { name: "Charlotte Metro",    state: "NC", region: "Southeast",     visits: 42, lab: 4 },
  { name: "Raleigh Durham",     state: "NC", region: "Southeast",     visits: 36, lab: 4 },
  { name: "Nashville Central",  state: "TN", region: "Southeast",     visits: 40, lab: 0 },
  { name: "Seattle Capitol Hill",state:"WA", region: "Northwest",     visits: 46, lab: 1 },
  { name: "Seattle Bellevue",   state: "WA", region: "Northwest",     visits: 51, lab: 1 },
  { name: "Portland Central",   state: "OR", region: "Northwest",     visits: 38, lab: 2 },
  { name: "Portland East",      state: "OR", region: "Northwest",     visits: 32, lab: 2 },
  { name: "Denver Cherry Creek",state: "CO", region: "Northwest",     visits: 44, lab: 3 },
  { name: "Denver Aurora",      state: "CO", region: "Northwest",     visits: 39, lab: 3 },
  { name: "Salt Lake City",     state: "UT", region: "Northwest",     visits: 35, lab: 4 },
  { name: "Las Vegas East",     state: "NV", region: "Southwest",     visits: 47, lab: 0 },
  { name: "Las Vegas West",     state: "NV", region: "Southwest",     visits: 43, lab: 0 },
  { name: "Albuquerque Metro",  state: "NM", region: "Southwest",     visits: 30, lab: 4 },
];

const MANAGERS = [
  "Sarah Chen", "Marcus Johnson", "Priya Patel", "David Kim", "Maria Rodriguez",
  "James Wilson", "Amanda Foster", "Robert Lee", "Linda Martinez", "Kevin Thompson",
  "Jennifer Adams", "Michael Brown", "Stephanie Davis", "Christopher White", "Angela Harris",
];

function generateKits(visits: number, bufferPct: number): KitOrder[] {
  return KIT_CATALOG.map((kit) => {
    const forecasted = Math.ceil(visits * kit.kitsPerVisit);
    const bufferQty  = Math.ceil(forecasted * bufferPct);
    const recommended = Math.min(Math.max(forecasted + bufferQty, 5), 500);
    return {
      kitId: kit.kitId,
      kitName: kit.kitName,
      category: kit.category,
      visitsRequiring: Math.ceil(visits * kit.kitsPerVisit),
      kitsPerVisit: kit.kitsPerVisit,
      forecasted,
      bufferQty,
      recommended,
      approved: recommended,
      unitCost: kit.unitCost,
    };
  });
}

export const DEFAULT_CONFIG = {
  forecastWindowDays: 14,
  bufferPct: 0.15,
  minOrderThreshold: 5,
  maxOrderCap: 500,
  cronSchedule: "Daily 2:00 AM EST",
  hawkeyeSyncInterval: "Every 6 hours",
  notificationEmails: "apc-managers@optum.com",
  autoApproveUnder: 10,
  erpEndpoint: "https://erp.optum.internal/api/v2/orders",
  dryRunMode: false,
};

export function generateAPCs(): APC[] {
  const statuses: APC["status"][] = ["pending", "pending", "pending", "approved", "modified"];
  return APC_RAW.map((raw, i) => {
    const kits = generateKits(raw.visits, DEFAULT_CONFIG.bufferPct);
    const totalCost = kits.reduce((sum, k) => sum + k.recommended * k.unitCost, 0);
    const manager = MANAGERS[i % MANAGERS.length];
    const firstName = manager.split(" ")[0].toLowerCase();
    const lastName = manager.split(" ")[1].toLowerCase();
    return {
      id: `APC-${String(i + 1).padStart(3, "0")}`,
      name: raw.name,
      state: raw.state,
      region: raw.region,
      lab: LABS[raw.lab],
      manager,
      email: `${firstName}.${lastName}@optum.com`,
      upcomingVisits: raw.visits,
      currentStock: Math.floor(raw.visits * 0.3),
      kits,
      status: statuses[i % statuses.length],
      lastOrderDate: "2026-05-24",
      totalCost,
    };
  });
}

export const AGENT_RUNS: AgentRun[] = [
  { id: "RUN-005", triggeredAt: "2026-06-07 02:00 EST", completedAt: "2026-06-07 02:00:28 EST", apcCount: 50, kitsCalculated: 847, ordersGenerated: 50, trigger: "cron",        status: "completed" },
  { id: "RUN-004", triggeredAt: "2026-06-06 02:00 EST", completedAt: "2026-06-06 02:00:31 EST", apcCount: 50, kitsCalculated: 832, ordersGenerated: 50, trigger: "cron",        status: "completed" },
  { id: "RUN-003", triggeredAt: "2026-06-05 14:22 EST", completedAt: "2026-06-05 14:22:19 EST", apcCount: 50, kitsCalculated: 791, ordersGenerated: 48, trigger: "data-change", status: "completed" },
  { id: "RUN-002", triggeredAt: "2026-06-05 02:00 EST", completedAt: "2026-06-05 02:00:24 EST", apcCount: 50, kitsCalculated: 815, ordersGenerated: 50, trigger: "cron",        status: "completed" },
  { id: "RUN-001", triggeredAt: "2026-06-04 02:00 EST", completedAt: "2026-06-04 02:00:33 EST", apcCount: 50, kitsCalculated: 798, ordersGenerated: 50, trigger: "cron",        status: "completed" },
];
