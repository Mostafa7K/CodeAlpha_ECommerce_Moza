// Database initialization script.
// Reads schema.sql and seed.sql and executes them against the configured MySQL server.
// Usage: npm run db:init

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const useSSL = process.env.DB_SSL === 'true';

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    ...(useSSL ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {})
  });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

    console.log('Running schema.sql...');
    await connection.query(schemaSql);

    console.log('Running seed.sql...');
    await connection.query(seedSql);

    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

run();
