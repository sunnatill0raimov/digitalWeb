const pool = require('../config/db');

exports.logs = async (req, res) => {
  const { product_id, type } = req.query;
  let q = `SELECT il.*,p.name AS product_name,p.sku,u.full_name AS user_name
           FROM inventory_logs il
           LEFT JOIN products p ON il.product_id=p.id
           LEFT JOIN users    u ON il.user_id=u.id
           WHERE 1=1`;
  const p = []; let i = 1;
  if (product_id) { q += ` AND il.product_id=$${i}`; p.push(product_id); i++; }
  if (type)       { q += ` AND il.type=$${i}`;       p.push(type);       i++; }
  q += ' ORDER BY il.created_at DESC LIMIT 300';
  const { rows } = await pool.query(q, p);
  res.json(rows);
};

exports.stockIn = async (req, res) => {
  const { product_id, quantity, note } = req.body;
  if (!product_id || !quantity || quantity <= 0)
    return res.status(400).json({ message: 'Mahsulot va miqdor shart' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE products SET quantity=quantity+$1 WHERE id=$2', [quantity, product_id]
    );
    const { rows } = await client.query(
      `INSERT INTO inventory_logs(product_id,user_id,type,quantity,note)
       VALUES($1,$2,'in',$3,$4) RETURNING *`,
      [product_id, req.user.id, quantity, note || null]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Server xatosi' });
  } finally {
    client.release();
  }
};

exports.stockOut = async (req, res) => {
  const { product_id, quantity, note } = req.body;
  if (!product_id || !quantity || quantity <= 0)
    return res.status(400).json({ message: 'Mahsulot va miqdor shart' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const pr = await client.query(
      'SELECT quantity FROM products WHERE id=$1 FOR UPDATE', [product_id]
    );
    if (!pr.rows[0]) throw new Error('Mahsulot topilmadi');
    if (pr.rows[0].quantity < quantity) throw new Error("Yetarli miqdor yo'q");
    await client.query(
      'UPDATE products SET quantity=quantity-$1 WHERE id=$2', [quantity, product_id]
    );
    const { rows } = await client.query(
      `INSERT INTO inventory_logs(product_id,user_id,type,quantity,note)
       VALUES($1,$2,'out',$3,$4) RETURNING *`,
      [product_id, req.user.id, quantity, note || null]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: e.message });
  } finally {
    client.release();
  }
};
