-- Moza Candle Store - Seed Data
-- Pre-populates the products table with sample Moza candle products.
-- Safe to re-run: it only inserts the seed products if the table is empty.

USE moza_db;

INSERT INTO products (name, description, price, stock_quantity, image_url, burn_time)
SELECT * FROM (
  SELECT
    'Lavender Calm' AS name,
    'A soothing blend of French lavender and chamomile, hand-poured into a reusable amber glass jar. Perfect for unwinding after a long day and creating a peaceful bedtime ritual.' AS description,
    24.99 AS price,
    35 AS stock_quantity,
    '/assets/lavender-calm.svg' AS image_url,
    '45-50 hours' AS burn_time
  UNION ALL
  SELECT
    'Vanilla Sunset',
    'Warm Madagascan vanilla bean layered with hints of toasted caramel and sandalwood. A cozy, comforting scent that fills any room with golden-hour warmth.',
    22.99,
    40,
    '/assets/vanilla-sunset.svg',
    '40-45 hours'
  UNION ALL
  SELECT
    'Cinnamon Spice',
    'A bold, warming fusion of Ceylon cinnamon, clove, and orange zest. Hand-poured with natural soy wax for a clean burn that brings the comfort of home all year round.',
    23.99,
    28,
    '/assets/cinnamon-spice.svg',
    '45-50 hours'
) AS seed_products
WHERE NOT EXISTS (SELECT 1 FROM products);
