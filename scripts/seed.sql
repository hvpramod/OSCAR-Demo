-- ============================================================
-- OSCAR Seed Script
-- Run this entire file in pgAdmin connected to oscar_db
-- Query Tool → File → Open → select this file → Run (F5)
-- ============================================================

-- Step 1: Grant permissions to oscar_user
GRANT ALL ON SCHEMA public TO oscar_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO oscar_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO oscar_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO oscar_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO oscar_user;

-- ============================================================
-- Step 2: Create tables
-- ============================================================

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
  kit_id         VARCHAR(20)   PRIMARY KEY,
  kit_name       VARCHAR(100)  NOT NULL,
  category       VARCHAR(50)   NOT NULL,
  kits_per_visit NUMERIC(4,2)  NOT NULL,
  unit_cost      NUMERIC(8,2)  NOT NULL,
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

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

-- Grant on newly created tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO oscar_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO oscar_user;

-- ============================================================
-- Step 3: Clear existing data
-- ============================================================
TRUNCATE hawkeye_visits, hawkeye_patients, hawkeye_providers,
         hawkeye_kit_catalog, hawkeye_apcs CASCADE;

-- ============================================================
-- Step 4: Kit Catalog
-- ============================================================
INSERT INTO hawkeye_kit_catalog (kit_id, kit_name, category, kits_per_visit, unit_cost) VALUES
  ('KIT-001','CBC Lab Kit',           'Lab',      1.00, 4.25),
  ('KIT-002','HbA1c Kit',             'Lab',      0.60, 6.10),
  ('KIT-003','Lipid Panel Kit',       'Lab',      0.50, 5.80),
  ('KIT-004','Urinalysis Kit',        'Lab',      0.40, 3.50),
  ('KIT-005','INR/PT Kit',            'Lab',      0.30, 7.20),
  ('KIT-006','Referral Form Packet',  'Print',    1.00, 0.35),
  ('KIT-007','Care Plan Booklet',     'Print',    1.00, 1.20),
  ('KIT-008','Wound Care Kit',        'Clinical', 0.20, 12.40),
  ('KIT-009','Blood Pressure Cuff',   'Equipment',0.10, 28.00),
  ('KIT-010','Flu Vaccine Kit',       'Vaccine',  0.80, 15.60)
ON CONFLICT (kit_id) DO NOTHING;

-- ============================================================
-- Step 5: APCs
-- ============================================================
INSERT INTO hawkeye_apcs (id, name, region, state, lab, manager_name, manager_email) VALUES
  ('APC-001','Phoenix West',        'Southwest',    'AZ','Quest Diagnostics', 'Sarah Chen',        'sarah.chen@optum.com'),
  ('APC-002','Phoenix East',        'Southwest',    'AZ','Quest Diagnostics', 'Marcus Johnson',    'marcus.johnson@optum.com'),
  ('APC-003','Scottsdale North',    'Southwest',    'AZ','Quest Diagnostics', 'Priya Patel',       'priya.patel@optum.com'),
  ('APC-004','Tucson Central',      'Southwest',    'AZ','LabCorp',           'David Kim',         'david.kim@optum.com'),
  ('APC-005','Mesa Valley',         'Southwest',    'AZ','LabCorp',           'Maria Rodriguez',   'maria.rodriguez@optum.com'),
  ('APC-006','Dallas North',        'South Central','TX','Quest Diagnostics', 'James Wilson',      'james.wilson@optum.com'),
  ('APC-007','Dallas South',        'South Central','TX','Quest Diagnostics', 'Amanda Foster',     'amanda.foster@optum.com'),
  ('APC-008','Houston Heights',     'South Central','TX','LabCorp',           'Robert Lee',        'robert.lee@optum.com'),
  ('APC-009','Houston Galleria',    'South Central','TX','LabCorp',           'Linda Martinez',    'linda.martinez@optum.com'),
  ('APC-010','Austin Central',      'South Central','TX','BioReference',      'Kevin Thompson',    'kevin.thompson@optum.com'),
  ('APC-011','San Antonio West',    'South Central','TX','BioReference',      'Jennifer Adams',    'jennifer.adams@optum.com'),
  ('APC-012','Minneapolis East',    'Midwest',      'MN','Sonic Healthcare',  'Michael Brown',     'michael.brown@optum.com'),
  ('APC-013','Minneapolis West',    'Midwest',      'MN','Sonic Healthcare',  'Stephanie Davis',   'stephanie.davis@optum.com'),
  ('APC-014','St. Paul Central',    'Midwest',      'MN','Sonic Healthcare',  'Christopher White', 'christopher.white@optum.com'),
  ('APC-015','Chicago North Shore', 'Midwest',      'IL','Quest Diagnostics', 'Angela Harris',     'angela.harris@optum.com'),
  ('APC-016','Chicago West Loop',   'Midwest',      'IL','Quest Diagnostics', 'Sarah Chen',        'sarah.chen2@optum.com'),
  ('APC-017','Chicago South Side',  'Midwest',      'IL','LabCorp',           'Marcus Johnson',    'marcus.johnson2@optum.com'),
  ('APC-018','Detroit Metro',       'Midwest',      'MI','ARUP Laboratories', 'Priya Patel',       'priya.patel2@optum.com'),
  ('APC-019','Columbus Central',    'Midwest',      'OH','ARUP Laboratories', 'David Kim',         'david.kim2@optum.com'),
  ('APC-020','Cleveland Heights',   'Midwest',      'OH','ARUP Laboratories', 'Maria Rodriguez',   'maria.rodriguez2@optum.com'),
  ('APC-021','New York Bronx',      'Northeast',    'NY','LabCorp',           'James Wilson',      'james.wilson2@optum.com'),
  ('APC-022','New York Brooklyn',   'Northeast',    'NY','LabCorp',           'Amanda Foster',     'amanda.foster2@optum.com'),
  ('APC-023','New York Queens',     'Northeast',    'NY','Quest Diagnostics', 'Robert Lee',        'robert.lee2@optum.com'),
  ('APC-024','New York Manhattan',  'Northeast',    'NY','Quest Diagnostics', 'Linda Martinez',    'linda.martinez2@optum.com'),
  ('APC-025','Boston Back Bay',     'Northeast',    'MA','BioReference',      'Kevin Thompson',    'kevin.thompson2@optum.com'),
  ('APC-026','Boston South End',    'Northeast',    'MA','BioReference',      'Jennifer Adams',    'jennifer.adams2@optum.com'),
  ('APC-027','Philadelphia North',  'Northeast',    'PA','Sonic Healthcare',  'Michael Brown',     'michael.brown2@optum.com'),
  ('APC-028','Philadelphia South',  'Northeast',    'PA','Sonic Healthcare',  'Stephanie Davis',   'stephanie.davis2@optum.com'),
  ('APC-029','Newark Central',      'Northeast',    'NJ','LabCorp',           'Christopher White', 'christopher.white2@optum.com'),
  ('APC-030','Hartford Metro',      'Northeast',    'CT','BioReference',      'Angela Harris',     'angela.harris2@optum.com'),
  ('APC-031','Atlanta Buckhead',    'Southeast',    'GA','Quest Diagnostics', 'Sarah Chen',        'sarah.chen3@optum.com'),
  ('APC-032','Atlanta Midtown',     'Southeast',    'GA','Quest Diagnostics', 'Marcus Johnson',    'marcus.johnson3@optum.com'),
  ('APC-033','Atlanta South',       'Southeast',    'GA','LabCorp',           'Priya Patel',       'priya.patel3@optum.com'),
  ('APC-034','Miami Beach',         'Southeast',    'FL','BioReference',      'David Kim',         'david.kim3@optum.com'),
  ('APC-035','Miami Doral',         'Southeast',    'FL','BioReference',      'Maria Rodriguez',   'maria.rodriguez3@optum.com'),
  ('APC-036','Orlando Central',     'Southeast',    'FL','Sonic Healthcare',  'James Wilson',      'james.wilson3@optum.com'),
  ('APC-037','Tampa Bay',           'Southeast',    'FL','Sonic Healthcare',  'Amanda Foster',     'amanda.foster3@optum.com'),
  ('APC-038','Charlotte Metro',     'Southeast',    'NC','ARUP Laboratories', 'Robert Lee',        'robert.lee3@optum.com'),
  ('APC-039','Raleigh Durham',      'Southeast',    'NC','ARUP Laboratories', 'Linda Martinez',    'linda.martinez3@optum.com'),
  ('APC-040','Nashville Central',   'Southeast',    'TN','Quest Diagnostics', 'Kevin Thompson',    'kevin.thompson3@optum.com'),
  ('APC-041','Seattle Capitol Hill','Northwest',    'WA','LabCorp',           'Jennifer Adams',    'jennifer.adams3@optum.com'),
  ('APC-042','Seattle Bellevue',    'Northwest',    'WA','LabCorp',           'Michael Brown',     'michael.brown3@optum.com'),
  ('APC-043','Portland Central',    'Northwest',    'OR','BioReference',      'Stephanie Davis',   'stephanie.davis3@optum.com'),
  ('APC-044','Portland East',       'Northwest',    'OR','BioReference',      'Christopher White', 'christopher.white3@optum.com'),
  ('APC-045','Denver Cherry Creek', 'Northwest',    'CO','Sonic Healthcare',  'Angela Harris',     'angela.harris3@optum.com'),
  ('APC-046','Denver Aurora',       'Northwest',    'CO','Sonic Healthcare',  'Sarah Chen',        'sarah.chen4@optum.com'),
  ('APC-047','Salt Lake City',      'Northwest',    'UT','ARUP Laboratories', 'Marcus Johnson',    'marcus.johnson4@optum.com'),
  ('APC-048','Las Vegas East',      'Southwest',    'NV','Quest Diagnostics', 'Priya Patel',       'priya.patel4@optum.com'),
  ('APC-049','Las Vegas West',      'Southwest',    'NV','Quest Diagnostics', 'David Kim',         'david.kim4@optum.com'),
  ('APC-050','Albuquerque Metro',   'Southwest',    'NM','ARUP Laboratories', 'Maria Rodriguez',   'maria.rodriguez4@optum.com')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 6: Providers (2 per APC = 100 total)
-- ============================================================
INSERT INTO hawkeye_providers (id, name, npi, apc_id, specialty, active) VALUES
  ('PRV-APC-001-1','Dr. James Smith',       '1234567890','APC-001','Internal Medicine',true),
  ('PRV-APC-001-2','Dr. Mary Johnson',      '1234567891','APC-001','Family Medicine',true),
  ('PRV-APC-002-1','Dr. Robert Williams',   '1234567892','APC-002','Geriatrics',true),
  ('PRV-APC-002-2','Dr. Patricia Brown',    '1234567893','APC-002','Internal Medicine',true),
  ('PRV-APC-003-1','Dr. John Jones',        '1234567894','APC-003','Family Medicine',true),
  ('PRV-APC-003-2','Dr. Jennifer Garcia',   '1234567895','APC-003','Chronic Disease Management',true),
  ('PRV-APC-004-1','Dr. Michael Miller',    '1234567896','APC-004','Internal Medicine',true),
  ('PRV-APC-004-2','Dr. Linda Davis',       '1234567897','APC-004','Geriatrics',true),
  ('PRV-APC-005-1','Dr. William Wilson',    '1234567898','APC-005','Family Medicine',true),
  ('PRV-APC-005-2','Dr. Barbara Taylor',    '1234567899','APC-005','Internal Medicine',true),
  ('PRV-APC-006-1','Dr. David Anderson',    '1234567900','APC-006','Internal Medicine',true),
  ('PRV-APC-006-2','Dr. Susan Thomas',      '1234567901','APC-006','Geriatrics',true),
  ('PRV-APC-007-1','Dr. Richard Jackson',   '1234567902','APC-007','Family Medicine',true),
  ('PRV-APC-007-2','Dr. Jessica White',     '1234567903','APC-007','Internal Medicine',true),
  ('PRV-APC-008-1','Dr. Joseph Harris',     '1234567904','APC-008','Geriatrics',true),
  ('PRV-APC-008-2','Dr. Sarah Martin',      '1234567905','APC-008','Chronic Disease Management',true),
  ('PRV-APC-009-1','Dr. Thomas Thompson',   '1234567906','APC-009','Internal Medicine',true),
  ('PRV-APC-009-2','Dr. Karen Moore',       '1234567907','APC-009','Family Medicine',true),
  ('PRV-APC-010-1','Dr. Charles Young',     '1234567908','APC-010','Internal Medicine',true),
  ('PRV-APC-010-2','Dr. Lisa Lee',          '1234567909','APC-010','Geriatrics',true),
  ('PRV-APC-011-1','Dr. James Smith',       '1234567910','APC-011','Family Medicine',true),
  ('PRV-APC-011-2','Dr. Mary Johnson',      '1234567911','APC-011','Internal Medicine',true),
  ('PRV-APC-012-1','Dr. Robert Williams',   '1234567912','APC-012','Geriatrics',true),
  ('PRV-APC-012-2','Dr. Patricia Brown',    '1234567913','APC-012','Chronic Disease Management',true),
  ('PRV-APC-013-1','Dr. John Jones',        '1234567914','APC-013','Internal Medicine',true),
  ('PRV-APC-013-2','Dr. Jennifer Garcia',   '1234567915','APC-013','Family Medicine',true),
  ('PRV-APC-014-1','Dr. Michael Miller',    '1234567916','APC-014','Geriatrics',true),
  ('PRV-APC-014-2','Dr. Linda Davis',       '1234567917','APC-014','Internal Medicine',true),
  ('PRV-APC-015-1','Dr. William Wilson',    '1234567918','APC-015','Family Medicine',true),
  ('PRV-APC-015-2','Dr. Barbara Taylor',    '1234567919','APC-015','Chronic Disease Management',true),
  ('PRV-APC-016-1','Dr. David Anderson',    '1234567920','APC-016','Internal Medicine',true),
  ('PRV-APC-016-2','Dr. Susan Thomas',      '1234567921','APC-016','Geriatrics',true),
  ('PRV-APC-017-1','Dr. Richard Jackson',   '1234567922','APC-017','Family Medicine',true),
  ('PRV-APC-017-2','Dr. Jessica White',     '1234567923','APC-017','Internal Medicine',true),
  ('PRV-APC-018-1','Dr. Joseph Harris',     '1234567924','APC-018','Geriatrics',true),
  ('PRV-APC-018-2','Dr. Sarah Martin',      '1234567925','APC-018','Chronic Disease Management',true),
  ('PRV-APC-019-1','Dr. Thomas Thompson',   '1234567926','APC-019','Internal Medicine',true),
  ('PRV-APC-019-2','Dr. Karen Moore',       '1234567927','APC-019','Family Medicine',true),
  ('PRV-APC-020-1','Dr. Charles Young',     '1234567928','APC-020','Internal Medicine',true),
  ('PRV-APC-020-2','Dr. Lisa Lee',          '1234567929','APC-020','Geriatrics',true),
  ('PRV-APC-021-1','Dr. James Smith',       '1234567930','APC-021','Family Medicine',true),
  ('PRV-APC-021-2','Dr. Mary Johnson',      '1234567931','APC-021','Internal Medicine',true),
  ('PRV-APC-022-1','Dr. Robert Williams',   '1234567932','APC-022','Geriatrics',true),
  ('PRV-APC-022-2','Dr. Patricia Brown',    '1234567933','APC-022','Chronic Disease Management',true),
  ('PRV-APC-023-1','Dr. John Jones',        '1234567934','APC-023','Internal Medicine',true),
  ('PRV-APC-023-2','Dr. Jennifer Garcia',   '1234567935','APC-023','Family Medicine',true),
  ('PRV-APC-024-1','Dr. Michael Miller',    '1234567936','APC-024','Geriatrics',true),
  ('PRV-APC-024-2','Dr. Linda Davis',       '1234567937','APC-024','Internal Medicine',true),
  ('PRV-APC-025-1','Dr. William Wilson',    '1234567938','APC-025','Family Medicine',true),
  ('PRV-APC-025-2','Dr. Barbara Taylor',    '1234567939','APC-025','Chronic Disease Management',true),
  ('PRV-APC-026-1','Dr. David Anderson',    '1234567940','APC-026','Internal Medicine',true),
  ('PRV-APC-026-2','Dr. Susan Thomas',      '1234567941','APC-026','Geriatrics',true),
  ('PRV-APC-027-1','Dr. Richard Jackson',   '1234567942','APC-027','Family Medicine',true),
  ('PRV-APC-027-2','Dr. Jessica White',     '1234567943','APC-027','Internal Medicine',true),
  ('PRV-APC-028-1','Dr. Joseph Harris',     '1234567944','APC-028','Geriatrics',true),
  ('PRV-APC-028-2','Dr. Sarah Martin',      '1234567945','APC-028','Chronic Disease Management',true),
  ('PRV-APC-029-1','Dr. Thomas Thompson',   '1234567946','APC-029','Internal Medicine',true),
  ('PRV-APC-029-2','Dr. Karen Moore',       '1234567947','APC-029','Family Medicine',true),
  ('PRV-APC-030-1','Dr. Charles Young',     '1234567948','APC-030','Internal Medicine',true),
  ('PRV-APC-030-2','Dr. Lisa Lee',          '1234567949','APC-030','Geriatrics',true),
  ('PRV-APC-031-1','Dr. James Smith',       '1234567950','APC-031','Family Medicine',true),
  ('PRV-APC-031-2','Dr. Mary Johnson',      '1234567951','APC-031','Internal Medicine',true),
  ('PRV-APC-032-1','Dr. Robert Williams',   '1234567952','APC-032','Geriatrics',true),
  ('PRV-APC-032-2','Dr. Patricia Brown',    '1234567953','APC-032','Chronic Disease Management',true),
  ('PRV-APC-033-1','Dr. John Jones',        '1234567954','APC-033','Internal Medicine',true),
  ('PRV-APC-033-2','Dr. Jennifer Garcia',   '1234567955','APC-033','Family Medicine',true),
  ('PRV-APC-034-1','Dr. Michael Miller',    '1234567956','APC-034','Geriatrics',true),
  ('PRV-APC-034-2','Dr. Linda Davis',       '1234567957','APC-034','Internal Medicine',true),
  ('PRV-APC-035-1','Dr. William Wilson',    '1234567958','APC-035','Family Medicine',true),
  ('PRV-APC-035-2','Dr. Barbara Taylor',    '1234567959','APC-035','Chronic Disease Management',true),
  ('PRV-APC-036-1','Dr. David Anderson',    '1234567960','APC-036','Internal Medicine',true),
  ('PRV-APC-036-2','Dr. Susan Thomas',      '1234567961','APC-036','Geriatrics',true),
  ('PRV-APC-037-1','Dr. Richard Jackson',   '1234567962','APC-037','Family Medicine',true),
  ('PRV-APC-037-2','Dr. Jessica White',     '1234567963','APC-037','Internal Medicine',true),
  ('PRV-APC-038-1','Dr. Joseph Harris',     '1234567964','APC-038','Geriatrics',true),
  ('PRV-APC-038-2','Dr. Sarah Martin',      '1234567965','APC-038','Chronic Disease Management',true),
  ('PRV-APC-039-1','Dr. Thomas Thompson',   '1234567966','APC-039','Internal Medicine',true),
  ('PRV-APC-039-2','Dr. Karen Moore',       '1234567967','APC-039','Family Medicine',true),
  ('PRV-APC-040-1','Dr. Charles Young',     '1234567968','APC-040','Internal Medicine',true),
  ('PRV-APC-040-2','Dr. Lisa Lee',          '1234567969','APC-040','Geriatrics',true),
  ('PRV-APC-041-1','Dr. James Smith',       '1234567970','APC-041','Family Medicine',true),
  ('PRV-APC-041-2','Dr. Mary Johnson',      '1234567971','APC-041','Internal Medicine',true),
  ('PRV-APC-042-1','Dr. Robert Williams',   '1234567972','APC-042','Geriatrics',true),
  ('PRV-APC-042-2','Dr. Patricia Brown',    '1234567973','APC-042','Chronic Disease Management',true),
  ('PRV-APC-043-1','Dr. John Jones',        '1234567974','APC-043','Internal Medicine',true),
  ('PRV-APC-043-2','Dr. Jennifer Garcia',   '1234567975','APC-043','Family Medicine',true),
  ('PRV-APC-044-1','Dr. Michael Miller',    '1234567976','APC-044','Geriatrics',true),
  ('PRV-APC-044-2','Dr. Linda Davis',       '1234567977','APC-044','Internal Medicine',true),
  ('PRV-APC-045-1','Dr. William Wilson',    '1234567978','APC-045','Family Medicine',true),
  ('PRV-APC-045-2','Dr. Barbara Taylor',    '1234567979','APC-045','Chronic Disease Management',true),
  ('PRV-APC-046-1','Dr. David Anderson',    '1234567980','APC-046','Internal Medicine',true),
  ('PRV-APC-046-2','Dr. Susan Thomas',      '1234567981','APC-046','Geriatrics',true),
  ('PRV-APC-047-1','Dr. Richard Jackson',   '1234567982','APC-047','Family Medicine',true),
  ('PRV-APC-047-2','Dr. Jessica White',     '1234567983','APC-047','Internal Medicine',true),
  ('PRV-APC-048-1','Dr. Joseph Harris',     '1234567984','APC-048','Geriatrics',true),
  ('PRV-APC-048-2','Dr. Sarah Martin',      '1234567985','APC-048','Chronic Disease Management',true),
  ('PRV-APC-049-1','Dr. Thomas Thompson',   '1234567986','APC-049','Internal Medicine',true),
  ('PRV-APC-049-2','Dr. Karen Moore',       '1234567987','APC-049','Family Medicine',true),
  ('PRV-APC-050-1','Dr. Charles Young',     '1234567988','APC-050','Internal Medicine',true),
  ('PRV-APC-050-2','Dr. Lisa Lee',          '1234567989','APC-050','Geriatrics',true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 7: Patients (10 per APC = 500 total)
-- ============================================================
DO $$
DECLARE
  apc_ids TEXT[] := ARRAY[
    'APC-001','APC-002','APC-003','APC-004','APC-005',
    'APC-006','APC-007','APC-008','APC-009','APC-010',
    'APC-011','APC-012','APC-013','APC-014','APC-015',
    'APC-016','APC-017','APC-018','APC-019','APC-020',
    'APC-021','APC-022','APC-023','APC-024','APC-025',
    'APC-026','APC-027','APC-028','APC-029','APC-030',
    'APC-031','APC-032','APC-033','APC-034','APC-035',
    'APC-036','APC-037','APC-038','APC-039','APC-040',
    'APC-041','APC-042','APC-043','APC-044','APC-045',
    'APC-046','APC-047','APC-048','APC-049','APC-050'
  ];
  first_names TEXT[] := ARRAY['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','William','Barbara'];
  last_names  TEXT[] := ARRAY['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Taylor'];
  apc_id TEXT;
  i INT;
  pat_id TEXT;
  dob_val DATE;
  diag_codes TEXT[];
  roll INT;
BEGIN
  FOREACH apc_id IN ARRAY apc_ids LOOP
    FOR i IN 1..10 LOOP
      pat_id  := 'PAT-' || apc_id || '-' || LPAD(i::TEXT, 3, '0');
      dob_val := CURRENT_DATE - INTERVAL '1 day' * (55*365 + floor(random()*30*365)::INT);
      -- assign diagnosis codes based on random roll
      roll := floor(random()*7)::INT;
      diag_codes := CASE roll
        WHEN 0 THEN ARRAY['E11.9','I10']
        WHEN 1 THEN ARRAY['E11.9','E78.5']
        WHEN 2 THEN ARRAY['I10','J44.1']
        WHEN 3 THEN ARRAY['E11.9']
        WHEN 4 THEN ARRAY['I10']
        WHEN 5 THEN ARRAY['E78.5','I10']
        ELSE        ARRAY[]::TEXT[]
      END;
      INSERT INTO hawkeye_patients (id, first_name, last_name, dob, gender, apc_id, diagnosis_codes)
      VALUES (
        pat_id,
        first_names[1 + floor(random()*10)::INT],
        last_names[1 + floor(random()*10)::INT],
        dob_val,
        CASE WHEN random() > 0.5 THEN 'M' ELSE 'F' END,
        apc_id,
        diag_codes
      ) ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- Step 8: Visits — distribute over next 14 days per APC
-- visit counts match the original mockData
-- ============================================================
DO $$
DECLARE
  apc_visit_counts INT[] := ARRAY[
    48,52,37,44,31, 61,55,72,68,43, 39,35,41,28,58,
    63,49,45,33,38, 82,76,69,91,54, 47,58,51,43,29,
    57,62,44,71,65, 53,48,42,36,40, 46,51,38,32,44,
    39,35,47,43,30
  ];
  apc_ids TEXT[] := ARRAY[
    'APC-001','APC-002','APC-003','APC-004','APC-005',
    'APC-006','APC-007','APC-008','APC-009','APC-010',
    'APC-011','APC-012','APC-013','APC-014','APC-015',
    'APC-016','APC-017','APC-018','APC-019','APC-020',
    'APC-021','APC-022','APC-023','APC-024','APC-025',
    'APC-026','APC-027','APC-028','APC-029','APC-030',
    'APC-031','APC-032','APC-033','APC-034','APC-035',
    'APC-036','APC-037','APC-038','APC-039','APC-040',
    'APC-041','APC-042','APC-043','APC-044','APC-045',
    'APC-046','APC-047','APC-048','APC-049','APC-050'
  ];
  visit_types TEXT[] := ARRAY['wellness','chronic_care','follow_up','lab_only','medication_review'];
  apc_id TEXT;
  apc_idx INT := 0;
  visit_count INT;
  v INT;
  pat_id TEXT;
  prv_id TEXT;
  pat_num INT;
  prv_num INT;
  vis_date DATE;
BEGIN
  FOREACH apc_id IN ARRAY apc_ids LOOP
    apc_idx     := apc_idx + 1;
    visit_count := apc_visit_counts[apc_idx];
    FOR v IN 1..visit_count LOOP
      pat_num  := 1 + floor(random()*10)::INT;
      prv_num  := 1 + floor(random()*2)::INT;
      pat_id   := 'PAT-' || apc_id || '-' || LPAD(pat_num::TEXT, 3, '0');
      prv_id   := 'PRV-' || apc_id || '-' || prv_num::TEXT;
      vis_date := CURRENT_DATE + (1 + floor(random()*14)::INT) * INTERVAL '1 day';
      INSERT INTO hawkeye_visits (id, patient_id, provider_id, apc_id, scheduled_date, visit_type, status)
      VALUES (
        'VIS-' || apc_id || '-' || LPAD(v::TEXT, 3, '0'),
        pat_id, prv_id, apc_id, vis_date,
        visit_types[1 + floor(random()*5)::INT],
        'scheduled'
      ) ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- Verify
-- ============================================================
SELECT 'APCs'      AS table_name, COUNT(*) AS rows FROM hawkeye_apcs      UNION ALL
SELECT 'Providers' AS table_name, COUNT(*) AS rows FROM hawkeye_providers  UNION ALL
SELECT 'Patients'  AS table_name, COUNT(*) AS rows FROM hawkeye_patients   UNION ALL
SELECT 'Visits'    AS table_name, COUNT(*) AS rows FROM hawkeye_visits     UNION ALL
SELECT 'Kits'      AS table_name, COUNT(*) AS rows FROM hawkeye_kit_catalog;
