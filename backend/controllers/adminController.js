import pool from '../config/db.js';

const LOW_STOCK_THRESHOLD = 5;

function parseProductInput(body) {
  const { name, description, price, stock_quantity, burn_time } = body;
  return {
    name: typeof name === 'string' ? name.trim() : undefined,
    description: typeof description === 'string' ? description.trim() : undefined,
    price: price !== undefined && price !== '' ? Number(price) : undefined,
    stock_quantity: stock_quantity !== undefined && stock_quantity !== '' ? Number(stock_quantity) : undefined,
    burn_time: typeof burn_time === 'string' ? burn_time.trim() : undefined
  };
}

export async function createProduct(req, res) {
  try {
    const { name, description, price, stock_quantity, burn_time } = parseProductInput(req.body);

    if (!name || !description || price === undefined || stock_quantity === undefined || !burn_time) {
      return res.status(400).json({ message: 'name, description, price, stock_quantity, and burn_time are required.' });
    }

    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock_quantity) || stock_quantity < 0) {
      return res.status(400).json({ message: 'price must be a non-negative number and stock_quantity a non-negative integer.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'A product image is required.' });
    }

    const imageUrl = req.file.path;

    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, stock_quantity, image_url, burn_time) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, stock_quantity, imageUrl, burn_time]
    );

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);

    return res.status(201).json({ message: 'Product created successfully.', product: rows[0] });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ message: 'Unable to create product at this time.' });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ message: 'Invalid product id.' });
    }

    const [existingRows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const existing = existingRows[0];
    const input = parseProductInput(req.body);

    if (input.price !== undefined && (!Number.isFinite(input.price) || input.price < 0)) {
      return res.status(400).json({ message: 'price must be a non-negative number.' });
    }

    if (input.stock_quantity !== undefined && (!Number.isInteger(input.stock_quantity) || input.stock_quantity < 0)) {
      return res.status(400).json({ message: 'stock_quantity must be a non-negative integer.' });
    }

    const updated = {
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      price: input.price ?? existing.price,
      stock_quantity: input.stock_quantity ?? existing.stock_quantity,
      burn_time: input.burn_time ?? existing.burn_time,
      image_url: req.file ? req.file.path : existing.image_url
    };

    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, stock_quantity = ?, burn_time = ?, image_url = ? WHERE id = ?',
      [updated.name, updated.description, updated.price, updated.stock_quantity, updated.burn_time, updated.image_url, id]
    );

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    return res.status(200).json({ message: 'Product updated successfully.', product: rows[0] });
  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ message: 'Unable to update product at this time.' });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ message: 'Invalid product id.' });
    }

    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      return res.status(409).json({ message: 'This product cannot be deleted because it is part of existing orders.' });
    }
    console.error('Delete product error:', err);
    return res.status(500).json({ message: 'Unable to delete product at this time.' });
  }
}

export async function getAllOrders(req, res) {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at, u.name AS customer_name, u.email AS customer_email
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC`
    );

    if (orders.length === 0) {
      return res.status(200).json({ orders: [] });
    }

    const orderIds = orders.map((order) => order.id);
    const placeholders = orderIds.map(() => '?').join(', ');

    const [items] = await pool.query(
      `SELECT oi.order_id, oi.quantity, oi.price, p.name AS product_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (${placeholders})`,
      orderIds
    );

    const itemsByOrder = new Map();
    for (const item of items) {
      if (!itemsByOrder.has(item.order_id)) {
        itemsByOrder.set(item.order_id, []);
      }
      itemsByOrder.get(item.order_id).push({
        productName: item.product_name,
        quantity: item.quantity,
        price: Number(item.price)
      });
    }

    const result = orders.map((order) => ({
      id: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      totalAmount: Number(order.total_amount),
      status: order.status,
      createdAt: order.created_at,
      items: itemsByOrder.get(order.id) || []
    }));

    return res.status(200).json({ orders: result });
  } catch (err) {
    console.error('Get all orders error:', err);
    return res.status(500).json({ message: 'Unable to fetch orders at this time.' });
  }
}

export async function getAdminStats(req, res) {
  try {
    const [[revenueRow]] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue FROM orders');
    const [[orderRow]] = await pool.query('SELECT COUNT(*) AS totalOrders FROM orders');

    const [lowStock] = await pool.query(
      'SELECT id, name, stock_quantity FROM products WHERE stock_quantity <= ? ORDER BY stock_quantity ASC',
      [LOW_STOCK_THRESHOLD]
    );

    const [topSelling] = await pool.query(
      `SELECT p.id, p.name, p.image_url, COALESCE(SUM(oi.quantity), 0) AS unitsSold
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id
       GROUP BY p.id, p.name, p.image_url
       ORDER BY unitsSold DESC
       LIMIT 5`
    );

    return res.status(200).json({
      totalRevenue: Number(revenueRow.totalRevenue),
      totalOrders: orderRow.totalOrders,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      lowStock,
      topSelling: topSelling.map((product) => ({ ...product, unitsSold: Number(product.unitsSold) }))
    });
  } catch (err) {
    console.error('Get admin stats error:', err);
    return res.status(500).json({ message: 'Unable to fetch admin statistics at this time.' });
  }
}
