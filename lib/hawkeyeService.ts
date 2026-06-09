/**
 * hawkeyeService.ts
 * All READ operations against the mock Hawkeye PostgreSQL tables.
 * Tables: hawkeye_apcs, hawkeye_patients, hawkeye_providers,
 *         hawkeye_visits, hawkeye_kit_catalog
 */
import { query, queryOne } from "./db";

// ── Types ──────────────────────────────────────────────────────

export interface HawkeyeAPC {
  id: string;
  name: string;
  region: string;
  state: string;
  lab: string;
  manager_name: string;
  manager_email: string;
}

export interface HawkeyePatient {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  apc_id: string;
  diagnosis_codes: string[];
}

export interface HawkeyeProvider {
  id: string;
  name: string;
  npi: string;
  apc_id: string;
  specialty: string;
  active: boolean;
}

export interface HawkeyeVisit {
  id: string;
  patient_id: string;
  provider_id: string;
  apc_id: string;
  scheduled_date: string;
  visit_type: string;
  status: string;
}

export interface HawkeyeKitCatalog {
  kit_id: string;
  kit_name: string;
  category: string;
  kits_per_visit: number;
  unit_cost: number;
}

export interface APCVisitSummary {
  apc_id: string;
  apc_name: string;
  region: string;
  state: string;
  lab: string;
  manager_name: string;
  manager_email: string;
  upcoming_visits: number;
}

// ── Queries ────────────────────────────────────────────────────

export async function getAllAPCs(): Promise<HawkeyeAPC[]> {
  return query<HawkeyeAPC>(
    `SELECT id, name, region, state, lab, manager_name, manager_email
     FROM hawkeye_apcs
     ORDER BY name`
  );
}

export async function getAPCById(apcId: string): Promise<HawkeyeAPC | null> {
  return queryOne<HawkeyeAPC>(
    `SELECT id, name, region, state, lab, manager_name, manager_email
     FROM hawkeye_apcs WHERE id = $1`,
    [apcId]
  );
}

export async function getUpcomingVisitsByAPC(
  forecastWindowDays: number
): Promise<APCVisitSummary[]> {
  return query<APCVisitSummary>(
    `SELECT
       a.id           AS apc_id,
       a.name         AS apc_name,
       a.region,
       a.state,
       a.lab,
       a.manager_name,
       a.manager_email,
       COUNT(v.id)::int AS upcoming_visits
     FROM hawkeye_apcs a
     LEFT JOIN hawkeye_visits v
       ON v.apc_id = a.id
       AND v.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 * INTERVAL '1 day')
       AND v.status = 'scheduled'
     GROUP BY a.id, a.name, a.region, a.state, a.lab, a.manager_name, a.manager_email
     ORDER BY a.name`,
    [forecastWindowDays]
  );
}

export async function getVisitsForAPC(
  apcId: string,
  forecastWindowDays: number
): Promise<HawkeyeVisit[]> {
  return query<HawkeyeVisit>(
    `SELECT v.id, v.patient_id, v.provider_id, v.apc_id,
            v.scheduled_date::text, v.visit_type, v.status
     FROM hawkeye_visits v
     WHERE v.apc_id = $1
       AND v.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $2
       AND v.status = 'scheduled'
     ORDER BY v.scheduled_date`,
    [apcId, forecastWindowDays]
  );
}

export async function getKitCatalog(): Promise<HawkeyeKitCatalog[]> {
  return query<HawkeyeKitCatalog>(
    `SELECT kit_id, kit_name, category,
            kits_per_visit::float, unit_cost::float
     FROM hawkeye_kit_catalog
     ORDER BY category, kit_name`
  );
}

export async function getPatientsByAPC(apcId: string): Promise<HawkeyePatient[]> {
  return query<HawkeyePatient>(
    `SELECT id, first_name, last_name, dob::text, gender, apc_id, diagnosis_codes
     FROM hawkeye_patients
     WHERE apc_id = $1
     ORDER BY last_name, first_name`,
    [apcId]
  );
}

export async function getProvidersByAPC(apcId: string): Promise<HawkeyeProvider[]> {
  return query<HawkeyeProvider>(
    `SELECT id, name, npi, apc_id, specialty, active
     FROM hawkeye_providers
     WHERE apc_id = $1 AND active = true`,
    [apcId]
  );
}
