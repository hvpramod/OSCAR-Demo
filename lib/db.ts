import { Pool } from "pg";

// Singleton pool — reused across API calls in the same process
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host:     process.env.POSTGRES_HOST     || "localhost",
      port:     parseInt(process.env.POSTGRES_PORT || "5432"),
      database: process.env.POSTGRES_DB       || "oscar_db",
      user:     process.env.POSTGRES_USER     || "oscar_user",
      password: process.env.POSTGRES_PASSWORD || "oscar_pass",
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("PostgreSQL pool error:", err);
    });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
