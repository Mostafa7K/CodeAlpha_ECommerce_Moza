// One-off TiDB migration: reset order numbering to be clean and sequential.
//
// TiDB caches AUTO_INCREMENT values in per-node batches (default 30,000), so
// order ids come out non-monotonic (e.g. #1, #30001, #60001) and a newer order
// can get a lower id than an older one. TiDB will not switch AUTO_ID_CACHE on an
// existing table ("Can't Alter AUTO_ID_CACHE between 1 and non-1"), so we
// recreate the orders + order_items tables with AUTO_ID_CACHE = 1.
//
// DESTRUCTIVE: this clears all rows in orders and order_items. users and
// products are left untouched. After running, new orders are numbered #1, #2,
// #3 ... sequentially. TiDB-only — AUTO_ID_CACHE is not valid on plain MySQL.
//
// Usage (from the backend/ directory): npm run db:fix-order-ids

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const useSSL = process.env.DB_SSL === 'true';

const STATEMENTS = [
  'SET FOREIGN_KEY_CHECKS = 0',
  'DROP TABLE IF EXISTS order_items',
  'DROP TABLE IF EXISTS orders',
  `CREATE TABLE orders (
     id INT AUTO_INCREMENT PRIMARY KEY,
     user_id INT NOT NULL,
     total_amount DECIMAL(10, 2) NOT NULL,
     status VARCHAR(50) NOT NULL DEFAULT 'Pending',
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT fk_orders_user
       FOREIGN KEY (user_id) REFERENCES users(id)
       ON DELETE CASCADE
   ) ENGINE=InnoDB AUTO_ID_CACHE = 1`,
  `CREATE TABLE order_items (
     id INT AUTO_INCREMENT PRIMARY KEY,
     order_id INT NOT NULL,
     product_id INT NOT NULL,
     quantity INT NOT NULL,
     price DECIMAL(10, 2) NOT NULL,
     CONSTRAINT fk_order_items_order
       FOREIGN KEY (order_id) REFERENCES orders(id)
       ON DELETE CASCADE,
     CONSTRAINT fk_order_items_product
       FOREIGN KEY (product_id) REFERENCES products(id)
       ON DELETE RESTRICT
   ) ENGINE=InnoDB AUTO_ID_CACHE = 1`,
  'SET FOREIGN_KEY_CHECKS = 1'
];

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'moza_db',
    ...(useSSL ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {})
  });

  try {
    const [[before]] = await connection.query(
      'SELECT COALESCE(MAX(id), 0) AS maxId, COUNT(*) AS count FROM orders'
    );
    console.log(`orders before: ${before.count} rows, current max id = ${before.maxId}`);

    for (const sql of STATEMENTS) {
      await connection.query(sql);
    }

    const [[after]] = await connection.query('SELECT COUNT(*) AS count FROM orders');
    console.log(`orders after: ${after.count} rows. Next order will be #1.`);
    console.log('Done. Order numbering is now clean and sequential.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

run();
