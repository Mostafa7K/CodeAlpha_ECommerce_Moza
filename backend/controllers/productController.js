import pool from '../config/db.js';

export async function getAllProducts(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, description, price, stock_quantity, image_url, burn_time, created_at
       FROM products
       ORDER BY created_at ASC`
    );

    return res.status(200).json({ products: rows });
  } catch (err) {
    console.error('Get products error:', err);
    return res.status(500).json({ message: 'Unable to fetch products at this time.' });
  }
}

export async function getProductById(req, res) {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ message: 'Invalid product id.' });
    }

    const [rows] = await pool.query(
      `SELECT id, name, description, price, stock_quantity, image_url, burn_time, created_at
       FROM products
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.status(200).json({ product: rows[0] });
  } catch (err) {
    console.error('Get product error:', err);
    return res.status(500).json({ message: 'Unable to fetch this product at this time.' });
  }
}
