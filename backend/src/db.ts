import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export async function runMigrations() {
  const sql = fs.readFileSync(path.join(__dirname, 'db', 'migrate.sql'), 'utf8')
  await db.query(sql)
  console.log('Migrations complete')
}
