import pool from '../config/db.js';

export async function createOrder(req, res) {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Your cart is empty.' });
  }

  for (const item of items) {
    if (
      !item ||
      !Number.isInteger(item.productId) ||
      item.productId <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return res.status(400).json({ message: 'Each cart item must include a valid productId and a positive integer quantity.' });
    }
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const productIds = items.map((item) => item.productId);
    const placeholders = productIds.map(() => '?').join(', ');

    // Lock the relevant product rows for the duration of the transaction
    // so concurrent orders cannot oversell stock.
    const [products] = await connection.query(
      `SELECT id, name, price, stock_quantity FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
      productIds
    );

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        await connection.rollback();
        return res.status(404).json({ message: `Product with id ${item.productId} was not found.` });
      }

      if (product.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(409).json({
          message: `Not enough stock for "${product.name}". Only ${product.stock_quantity} left.`
        });
      }

      const lineTotal = Number(product.price) * item.quantity;
      totalAmount += lineTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;

    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [req.user.id, totalAmount, 'Ordered']
    );

    const orderId = orderResult.insertId;

    const orderItemsValues = orderItemsData.map((item) => [orderId, item.productId, item.quantity, item.price]);
    await connection.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
      [orderItemsValues]
    );

    for (const item of orderItemsData) {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }

    await connection.commit();

    return res.status(201).json({
      message: 'Order placed successfully.',
      order: {
        id: orderId,
        status: 'Ordered',
        totalAmount,
        items: orderItemsData.map((item) => ({
          productId: item.productId,
          name: productMap.get(item.productId).name,
          quantity: item.quantity,
          price: Number(item.price)
        }))
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error('Create order error:', err);
    return res.status(500).json({ message: 'Something went wrong while placing your order.' });
  } finally {
    connection.release();
  }
}
