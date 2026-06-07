const pool = require('../config/db');

exports.list = async (req, res) => {
  const { status, customer_id, from, to } = req.query;
  let q = `SELECT o.*,
             c.company_name AS customer_name,
             u.full_name    AS created_by
           FROM orders o
           LEFT JOIN customers c ON o.customer_id=c.id
           LEFT JOIN users     u ON o.user_id=u.id
           WHERE 1=1`;
  const p = []; let i = 1;
  if (status)      { q += ` AND o.status=$${i}`;                    p.push(status);      i++; }
  if (customer_id) { q += ` AND o.customer_id=$${i}`;               p.push(customer_id); i++; }
  if (from)        { q += ` AND o.created_at>=$${i}`;               p.push(from);        i++; }
  if (to)          { q += ` AND o.created_at<=$${i}`;               p.push(to);          i++; }
  q += ' ORDER BY o.created_at DESC';
  const { rows } = await pool.query(q, p);
  res.json(rows);
};

exports.get = async (req, res) => {
  const order = await pool.query(
    `SELECT o.*,c.company_name AS customer_name,c.phone AS customer_phone
     FROM orders o LEFT JOIN customers c ON o.customer_id=c.id WHERE o.id=$1`,
    [req.params.id]
  );
  if (!order.rows[0]) return res.status(404).json({ message: 'Topilmadi' });

  const items = await pool.query(
    `SELECT oi.*,p.name AS product_name,p.sku,p.unit
     FROM order_items oi LEFT JOIN products p ON oi.product_id=p.id
     WHERE oi.order_id=$1`,
    [req.params.id]
  );
  res.json({ ...order.rows[0], items: items.rows });
};

exports.create = async (req, res) => {
  const { customer_id, items, notes, paid_amount } = req.body;
  if (!customer_id || !Array.isArray(items) || !items.length)
    return res.status(400).json({ message: 'Mijoz va mahsulotlar shart' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ord = await client.query(
      `INSERT INTO orders(customer_id,user_id,status,notes,paid_amount)
       VALUES($1,$2,'pending',$3,$4) RETURNING *`,
      [customer_id, req.user.id, notes || null, paid_amount || 0]
    );
    const orderId = ord.rows[0].id;
    let total = 0;

    for (const item of items) {
      const pr = await client.query(
        'SELECT price,quantity FROM products WHERE id=$1 FOR UPDATE', [item.product_id]
      );
      if (!pr.rows[0]) throw new Error(`Mahsulot #${item.product_id} topilmadi`);
      if (pr.rows[0].quantity < item.quantity)
        throw new Error(`Yetarli miqdor yo'q (${item.product_id})`);

      const lineTotal = pr.rows[0].price * item.quantity;
      total += lineTotal;

      await client.query(
        'INSERT INTO order_items(order_id,product_id,quantity,price) VALUES($1,$2,$3,$4)',
        [orderId, item.product_id, item.quantity, pr.rows[0].price]
      );
      await client.query(
        'UPDATE products SET quantity=quantity-$1 WHERE id=$2', [item.quantity, item.product_id]
      );
      await client.query(
        `INSERT INTO inventory_logs(product_id,user_id,type,quantity,note)
         VALUES($1,$2,'out',$3,$4)`,
        [item.product_id, req.user.id, item.quantity, `Buyurtma #${orderId}`]
      );
    }

    await client.query('UPDATE orders SET total_amount=$1 WHERE id=$2', [total, orderId]);

    // Update customer debt
    const debt = total - (paid_amount || 0);
    if (debt > 0)
      await client.query('UPDATE customers SET debt=debt+$1 WHERE id=$2', [debt, customer_id]);

    await client.query('COMMIT');
    res.status(201).json({ ...ord.rows[0], total_amount: total });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: e.message });
  } finally {
    client.release();
  }
};

exports.updateStatus = async (req, res) => {
  const valid = ['pending','processing','shipped','delivered','cancelled'];
  if (!valid.includes(req.body.status))
    return res.status(400).json({ message: "Noto'g'ri status" });

  const { rows } = await pool.query(
    'UPDATE orders SET status=$1 WHERE id=$2 RETURNING *',
    [req.body.status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Topilmadi' });
  res.json(rows[0]);
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM orders WHERE id=$1', [req.params.id]);
  res.json({ message: "O'chirildi" });
};
