/**
 * seed.ts  —  Creates all tables and inserts mock Hawkeye + OSCAR data
 * Run with:  npx ts-node --skip-project scripts/seed.ts
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const pool = new Pool({
  host:     process.env.POSTGRES_HOST     || "localhost",
  port:     parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DB       || "oscar_db",
  user:     process.env.POSTGRES_USER     || "oscar_user",
  password: process.env.POSTGRES_PASSWORD || "oscar_pass",
});

// ── DDL ─────────────────────────────────────────────────────────

const DDL = `

-- ── Hawkeye tables (read-only for OSCAR) ──────────────────────

CREATE TABLE IF NOT EXISTS hawkeye_apcs (
  id            VARCHAR(20)  PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  region        VARCHAR(50)  NOT NULL,
  state         CHAR(2)      NOT NULL,
  lab           VARCHAR(100) NOT NULL,
  manager_name  VARCHAR(100) NOT NULL,
  manager_email VARCHAR(150) NOT NULL,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hawkeye_patients (
  id               VARCHAR(20)  PRIMARY KEY,
  first_name       VARCHAR(50)  NOT NULL,
  last_name        VARCHAR(50)  NOT NULL,
  dob              DATE         NOT NULL,
  gender           CHAR(1)      NOT NULL,
  apc_id           VARCHAR(20)  REFERENCES hawkeye_apcs(id),
  diagnosis_codes  TEXT[]       DEFAULT '{}',
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hawkeye_providers (
  id         VARCHAR(20)  PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  npi        VARCHAR(10)  NOT NULL,
  apc_id     VARCHAR(20)  REFERENCES hawkeye_apcs(id),
  specialty  VARCHAR(100) NOT NULL,
  active     BOOLEAN      DEFAULT TRUE,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hawkeye_visits (
  id             VARCHAR(30)  PRIMARY KEY,
  patient_id     VARCHAR(20)  REFERENCES hawkeye_patients(id),
  provider_id    VARCHAR(20)  REFERENCES hawkeye_providers(id),
  apc_id         VARCHAR(20)  REFERENCES hawkeye_apcs(id),
  scheduled_date DATE         NOT NULL,
  visit_type     VARCHAR(30)  NOT NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'scheduled',
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hawkeye_kit_catalog (
  kit_id        VARCHAR(20)   PRIMARY KEY,
  kit_name      VARCHAR(100)  NOT NULL,
  category      VARCHAR(50)   NOT NULL,
  kits_per_visit NUMERIC(4,2) NOT NULL,
  unit_cost      NUMERIC(8,2) NOT NULL,
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- ── OSCAR output tables (read-write) ──────────────────────────

CREATE TABLE IF NOT EXISTS oscar_agent_runs (
  id                   VARCHAR(30)  PRIMARY KEY,
  triggered_at         TIMESTAMPTZ  DEFAULT NOW(),
  completed_at         TIMESTAMPTZ,
  trigger_type         VARCHAR(20)  NOT NULL DEFAULT 'manual',
  forecast_window_days INTEGER      NOT NULL DEFAULT 14,
  buffer_pct           NUMERIC(4,2) NOT NULL DEFAULT 0.15,
  apc_count            INTEGER      NOT NULL DEFAULT 0,
  kits_calculated      INTEGER      NOT NULL DEFAULT 0,
  orders_generated     INTEGER      NOT NULL DEFAULT 0,
  status               VARCHAR(20)  NOT NULL DEFAULT 'running',
  created_at           TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oscar_kit_orders (
  id               VARCHAR(80)   PRIMARY KEY,
  run_id           VARCHAR(30)   REFERENCES oscar_agent_runs(id),
  apc_id           VARCHAR(20)   REFERENCES hawkeye_apcs(id),
  kit_id           VARCHAR(20)   REFERENCES hawkeye_kit_catalog(kit_id),
  upcoming_visits  INTEGER       NOT NULL DEFAULT 0,
  kits_per_visit   NUMERIC(4,2)  NOT NULL,
  forecasted_qty   INTEGER       NOT NULL,
  buffer_qty       INTEGER       NOT NULL,
  recommended_qty  INTEGER       NOT NULL,
  approved_qty     INTEGER       NOT NULL,
  unit_cost        NUMERIC(8,2)  NOT NULL,
  line_total       NUMERIC(10,2) NOT NULL,
  status           VARCHAR(20)   NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oscar_kit_orders_run_id  ON oscar_kit_orders(run_id);
CREATE INDEX IF NOT EXISTS idx_oscar_kit_orders_apc_id  ON oscar_kit_orders(apc_id);
CREATE INDEX IF NOT EXISTS idx_hawkeye_visits_apc_date  ON hawkeye_visits(apc_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_hawkeye_visits_status    ON hawkeye_visits(status);
`;

// ── Seed data ────────────────────────────────────────────────

const APCS = [
  ["APC-001","Phoenix West",       "Southwest",    "AZ","Quest Diagnostics", "Sarah Chen",        "sarah.chen@optum.com"],
  ["APC-002","Phoenix East",       "Southwest",    "AZ","Quest Diagnostics", "Marcus Johnson",    "marcus.johnson@optum.com"],
  ["APC-003","Scottsdale North",   "Southwest",    "AZ","Quest Diagnostics", "Priya Patel",       "priya.patel@optum.com"],
  ["APC-004","Tucson Central",     "Southwest",    "AZ","LabCorp",           "David Kim",         "david.kim@optum.com"],
  ["APC-005","Mesa Valley",        "Southwest",    "AZ","LabCorp",           "Maria Rodriguez",   "maria.rodriguez@optum.com"],
  ["APC-006","Dallas North",       "South Central","TX","Quest Diagnostics", "James Wilson",      "james.wilson@optum.com"],
  ["APC-007","Dallas South",       "South Central","TX","Quest Diagnostics", "Amanda Foster",     "amanda.foster@optum.com"],
  ["APC-008","Houston Heights",    "South Central","TX","LabCorp",           "Robert Lee",        "robert.lee@optum.com"],
  ["APC-009","Houston Galleria",   "South Central","TX","LabCorp",           "Linda Martinez",    "linda.martinez@optum.com"],
  ["APC-010","Austin Central",     "South Central","TX","BioReference",      "Kevin Thompson",    "kevin.thompson@optum.com"],
  ["APC-011","San Antonio West",   "South Central","TX","BioReference",      "Jennifer Adams",    "jennifer.adams@optum.com"],
  ["APC-012","Minneapolis East",   "Midwest",      "MN","Sonic Healthcare",  "Michael Brown",     "michael.brown@optum.com"],
  ["APC-013","Minneapolis West",   "Midwest",      "MN","Sonic Healthcare",  "Stephanie Davis",   "stephanie.davis@optum.com"],
  ["APC-014","St. Paul Central",   "Midwest",      "MN","Sonic Healthcare",  "Christopher White", "christopher.white@optum.com"],
  ["APC-015","Chicago North Shore","Midwest",      "IL","Quest Diagnostics", "Angela Harris",     "angela.harris@optum.com"],
  ["APC-016","Chicago West Loop",  "Midwest",      "IL","Quest Diagnostics", "Sarah Chen",        "sarah.chen2@optum.com"],
  ["APC-017","Chicago South Side", "Midwest",      "IL","LabCorp",           "Marcus Johnson",    "marcus.johnson2@optum.com"],
  ["APC-018","Detroit Metro",      "Midwest",      "MI","ARUP Laboratories", "Priya Patel",       "priya.patel2@optum.com"],
  ["APC-019","Columbus Central",   "Midwest",      "OH","ARUP Laboratories", "David Kim",         "david.kim2@optum.com"],
  ["APC-020","Cleveland Heights",  "Midwest",      "OH","ARUP Laboratories", "Maria Rodriguez",   "maria.rodriguez2@optum.com"],
  ["APC-021","New York Bronx",     "Northeast",    "NY","LabCorp",           "James Wilson",      "james.wilson2@optum.com"],
  ["APC-022","New York Brooklyn",  "Northeast",    "NY","LabCorp",           "Amanda Foster",     "amanda.foster2@optum.com"],
  ["APC-023","New York Queens",    "Northeast",    "NY","Quest Diagnostics", "Robert Lee",        "robert.lee2@optum.com"],
  ["APC-024","New York Manhattan", "Northeast",    "NY","Quest Diagnostics", "Linda Martinez",    "linda.martinez2@optum.com"],
  ["APC-025","Boston Back Bay",    "Northeast",    "MA","BioReference",      "Kevin Thompson",    "kevin.thompson2@optum.com"],
  ["APC-026","Boston South End",   "Northeast",    "MA","BioReference",      "Jennifer Adams",    "jennifer.adams2@optum.com"],
  ["APC-027","Philadelphia North", "Northeast",    "PA","Sonic Healthcare",  "Michael Brown",     "michael.brown2@optum.com"],
  ["APC-028","Philadelphia South", "Northeast",    "PA","Sonic Healthcare",  "Stephanie Davis",   "stephanie.davis2@optum.com"],
  ["APC-029","Newark Central",     "Northeast",    "NJ","LabCorp",           "Christopher White", "christopher.white2@optum.com"],
  ["APC-030","Hartford Metro",     "Northeast",    "CT","BioReference",      "Angela Harris",     "angela.harris2@optum.com"],
  ["APC-031","Atlanta Buckhead",   "Southeast",    "GA","Quest Diagnostics", "Sarah Chen",        "sarah.chen3@optum.com"],
  ["APC-032","Atlanta Midtown",    "Southeast",    "GA","Quest Diagnostics", "Marcus Johnson",    "marcus.johnson3@optum.com"],
  ["APC-033","Atlanta South",      "Southeast",    "GA","LabCorp",           "Priya Patel",       "priya.patel3@optum.com"],
  ["APC-034","Miami Beach",        "Southeast",    "FL","BioReference",      "David Kim",         "david.kim3@optum.com"],
  ["APC-035","Miami Doral",        "Southeast",    "FL","BioReference",      "Maria Rodriguez",   "maria.rodriguez3@optum.com"],
  ["APC-036","Orlando Central",    "Southeast",    "FL","Sonic Healthcare",  "James Wilson",      "james.wilson3@optum.com"],
  ["APC-037","Tampa Bay",          "Southeast",    "FL","Sonic Healthcare",  "Amanda Foster",     "amanda.foster3@optum.com"],
  ["APC-038","Charlotte Metro",    "Southeast",    "NC","ARUP Laboratories", "Robert Lee",        "robert.lee3@optum.com"],
  ["APC-039","Raleigh Durham",     "Southeast",    "NC","ARUP Laboratories", "Linda Martinez",    "linda.martinez3@optum.com"],
  ["APC-040","Nashville Central",  "Southeast",    "TN","Quest Diagnostics", "Kevin Thompson",    "kevin.thompson3@optum.com"],
  ["APC-041","Seattle Capitol Hill","Northwest",   "WA","LabCorp",           "Jennifer Adams",    "jennifer.adams3@optum.com"],
  ["APC-042","Seattle Bellevue",   "Northwest",    "WA","LabCorp",           "Michael Brown",     "michael.brown3@optum.com"],
  ["APC-043","Portland Central",   "Northwest",    "OR","BioReference",      "Stephanie Davis",   "stephanie.davis3@optum.com"],
  ["APC-044","Portland East",      "Northwest",    "OR","BioReference",      "Christopher White", "christopher.white3@optum.com"],
  ["APC-045","Denver Cherry Creek","Northwest",    "CO","Sonic Healthcare",  "Angela Harris",     "angela.harris3@optum.com"],
  ["APC-046","Denver Aurora",      "Northwest",    "CO","Sonic Healthcare",  "Sarah Chen",        "sarah.chen4@optum.com"],
  ["APC-047","Salt Lake City",     "Northwest",    "UT","ARUP Laboratories", "Marcus Johnson",    "marcus.johnson4@optum.com"],
  ["APC-048","Las Vegas East",     "Southwest",    "NV","Quest Diagnostics", "Priya Patel",       "priya.patel4@optum.com"],
  ["APC-049","Las Vegas West",     "Southwest",    "NV","Quest Diagnostics", "David Kim",         "david.kim4@optum.com"],
  ["APC-050","Albuquerque Metro",  "Southwest",    "NM","ARUP Laboratories", "Maria Rodriguez",   "maria.rodriguez4@optum.com"],
];

// Expected visits per APC over 30 days (from original mockData)
const APC_VISIT_COUNTS: Record<string, number> = {
  "APC-001":48,"APC-002":52,"APC-003":37,"APC-004":44,"APC-005":31,
  "APC-006":61,"APC-007":55,"APC-008":72,"APC-009":68,"APC-010":43,
  "APC-011":39,"APC-012":35,"APC-013":41,"APC-014":28,"APC-015":58,
  "APC-016":63,"APC-017":49,"APC-018":45,"APC-019":33,"APC-020":38,
  "APC-021":82,"APC-022":76,"APC-023":69,"APC-024":91,"APC-025":54,
  "APC-026":47,"APC-027":58,"APC-028":51,"APC-029":43,"APC-030":29,
  "APC-031":57,"APC-032":62,"APC-033":44,"APC-034":71,"APC-035":65,
  "APC-036":53,"APC-037":48,"APC-038":42,"APC-039":36,"APC-040":40,
  "APC-041":46,"APC-042":51,"APC-043":38,"APC-044":32,"APC-045":44,
  "APC-046":39,"APC-047":35,"APC-048":47,"APC-049":43,"APC-050":30,
};

const KIT_CATALOG = [
  ["KIT-001","CBC Lab Kit",           "Lab",      "1.00","4.25"],
  ["KIT-002","HbA1c Kit",             "Lab",      "0.60","6.10"],
  ["KIT-003","Lipid Panel Kit",       "Lab",      "0.50","5.80"],
  ["KIT-004","Urinalysis Kit",        "Lab",      "0.40","3.50"],
  ["KIT-005","INR/PT Kit",            "Lab",      "0.30","7.20"],
  ["KIT-006","Referral Form Packet",  "Print",    "1.00","0.35"],
  ["KIT-007","Care Plan Booklet",     "Print",    "1.00","1.20"],
  ["KIT-008","Wound Care Kit",        "Clinical", "0.20","12.40"],
  ["KIT-009","Blood Pressure Cuff",   "Equipment","0.10","28.00"],
  ["KIT-010","Flu Vaccine Kit",       "Vaccine",  "0.80","15.60"],
];

const VISIT_TYPES  = ["wellness","chronic_care","follow_up","lab_only","medication_review"];
const SPECIALTIES  = ["Internal Medicine","Family Medicine","Geriatrics","Chronic Disease Management"];
const DIAGNOSES    = [["E11.9","I10"],["E11.9","E78.5"],["I10","J44.1"],["E11.9"],["I10"],["E78.5","I10"],[]];
const FIRST_NAMES  = ["James","Mary","Robert","Patricia","John","Jennifer","Michael","Linda","William","Barbara",
                      "David","Susan","Richard","Jessica","Joseph","Sarah","Thomas","Karen","Charles","Lisa"];
const LAST_NAMES   = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Taylor",
                      "Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Moore","Young","Lee"];

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Creating tables...");
    await client.query(DDL);

    // Clear existing data
    await client.query("TRUNCATE hawkeye_visits, hawkeye_patients, hawkeye_providers, hawkeye_kit_catalog, hawkeye_apcs CASCADE");
    console.log("Cleared existing hawkeye data");

    // APCs
    for (const [id,name,region,state,lab,mgr,email] of APCS) {
      await client.query(
        `INSERT INTO hawkeye_apcs (id,name,region,state,lab,manager_name,manager_email)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [id,name,region,state,lab,mgr,email]
      );
    }
    console.log(`Inserted ${APCS.length} APCs`);

    // Kit catalog
    for (const [kit_id,kit_name,category,kits_per_visit,unit_cost] of KIT_CATALOG) {
      await client.query(
        `INSERT INTO hawkeye_kit_catalog (kit_id,kit_name,category,kits_per_visit,unit_cost)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (kit_id) DO NOTHING`,
        [kit_id,kit_name,category,kits_per_visit,unit_cost]
      );
    }
    console.log("Inserted kit catalog");

    // Patients, Providers, Visits per APC
    let totalPatients = 0, totalProviders = 0, totalVisits = 0;
    const rand = rng(42);

    for (const [apcId] of APCS) {
      const visitTarget = APC_VISIT_COUNTS[apcId] || 40;
      const patientCount = Math.ceil(visitTarget * 1.5); // more patients than visits

      // Providers (2-3 per APC)
      const providerCount = 2 + (rand() > 0.5 ? 1 : 0);
      const providerIds: string[] = [];
      for (let p = 0; p < providerCount; p++) {
        const pid = `PRV-${apcId}-${p+1}`;
        const firstName = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
        const lastName  = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
        const npi       = String(Math.floor(1000000000 + rand() * 9000000000)).slice(0,10);
        const specialty = SPECIALTIES[Math.floor(rand() * SPECIALTIES.length)];
        await client.query(
          `INSERT INTO hawkeye_providers (id,name,npi,apc_id,specialty,active)
           VALUES ($1,$2,$3,$4,$5,true) ON CONFLICT (id) DO NOTHING`,
          [pid, `Dr. ${firstName} ${lastName}`, npi, apcId, specialty]
        );
        providerIds.push(pid);
        totalProviders++;
      }

      // Patients
      const patientIds: string[] = [];
      for (let i = 0; i < patientCount; i++) {
        const patId     = `PAT-${apcId}-${String(i+1).padStart(3,"0")}`;
        const firstName = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
        const lastName  = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
        const gender    = rand() > 0.5 ? "M" : "F";
        const age       = 55 + Math.floor(rand() * 30);
        const dob       = new Date(new Date().getFullYear() - age, Math.floor(rand()*12), Math.floor(rand()*28)+1);
        const diagnoses = DIAGNOSES[Math.floor(rand() * DIAGNOSES.length)];
        await client.query(
          `INSERT INTO hawkeye_patients (id,first_name,last_name,dob,gender,apc_id,diagnosis_codes)
           VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
          [patId, firstName, lastName, dob.toISOString().slice(0,10), gender, apcId, diagnoses]
        );
        patientIds.push(patId);
        totalPatients++;
      }

      // Visits — distribute visitTarget visits over next 14 days
      const today = new Date();
      for (let v = 0; v < visitTarget; v++) {
        const visitId   = `VIS-${apcId}-${String(v+1).padStart(3,"0")}`;
        const daysAhead = Math.floor(rand() * 14) + 1; // 1-14 days from today
        const visitDate = new Date(today);
        visitDate.setDate(today.getDate() + daysAhead);
        const patId     = patientIds[Math.floor(rand() * patientIds.length)];
        const provId    = providerIds[Math.floor(rand() * providerIds.length)];
        const visitType = VISIT_TYPES[Math.floor(rand() * VISIT_TYPES.length)];
        await client.query(
          `INSERT INTO hawkeye_visits (id,patient_id,provider_id,apc_id,scheduled_date,visit_type,status)
           VALUES ($1,$2,$3,$4,$5,$6,'scheduled') ON CONFLICT (id) DO NOTHING`,
          [visitId, patId, provId, apcId, visitDate.toISOString().slice(0,10), visitType]
        );
        totalVisits++;
      }
    }

    console.log(`Inserted ${totalProviders} providers`);
    console.log(`Inserted ${totalPatients} patients`);
    console.log(`Inserted ${totalVisits} scheduled visits (next 14 days)`);
    console.log("\nSeed complete. Database ready for OSCAR.");

  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
