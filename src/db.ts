import { Pool } from 'pg';
import dotenv from "dotenv"

dotenv.config({ path: './config.env' });

const connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

console.log("PG_CONNECTION_STRING: ", connectionString);

export const pool = new Pool({
    connectionString
  });
pool.connect();
