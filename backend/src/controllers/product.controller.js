const pool = require('../config/db');
const fs   = require('fs');
const path = require('path');

exports.list = async (req, res) => {
  const { search, category_id, low_stock } = req.query;
  let q = `SELECT p.*,c.name AS category_name
           FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE 1=1`;
  const p = [];
  let i = 1;
  if (search) {
    q += ` AND (p.name ILIKE $${i} OR p.sku ILIKE $${i})`; p.push(`%${search}%`); i++;
  }
  if (category_id) {
    q += ` AND p.category_id=$${i}`; p.push(category_id); i++;
  }
  if (low_stock === '1') {
    q += ` AND p.quantity<=10`;
  }
  q += ' ORDER BY p.created_at DESC';
  const { rows } = await pool.query(q, p);
  res.json(rows);
};

exports.get = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*,c.name AS category_name
     FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.id=$1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Topilmadi' });
  res.json(rows[0]);
};

exports.create = async (req, res) => {
  const { category_id, name, sku, price, quantity, unit } = req.body;
  const image = req.file?.filename || null;
  if (!name || !sku || !price)
    return res.status(400).json({ message: 'Nom, SKU va narx shart' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO products(category_id,name,sku,price,quantity,unit,image)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [category_id || null, name, sku, price, quantity || 0, unit || 'dona', image]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'SKU mavjud' });
    res.status(500).json({ message: 'Server xatosi' });
  }
};

exports.update = async (req, res) => {
  const { category_id, name, sku, price, quantity, unit } = req.body;
  const existing = await pool.query('SELECT image FROM products WHERE id=$1', [req.params.id]);
  if (!existing.rows[0]) return res.status(404).json({ message: 'Topilmadi' });

  const image = req.file?.filename || existing.rows[0].image;
  if (req.file && existing.rows[0].image) {
    const old = path.join(__dirname, '../../uploads', existing.rows[0].image);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }
  const { rows } = await pool.query(
    `UPDATE products SET category_id=$1,name=$2,sku=$3,price=$4,
     quantity=$5,unit=$6,image=$7 WHERE id=$8 RETURNING *`,
    [category_id || null, name, sku, price, quantity, unit || 'dona', image, req.params.id]
  );
  res.json(rows[0]);
};

exports.remove = async (req, res) => {
  const { rows } = await pool.query('SELECT image FROM products WHERE id=$1', [req.params.id]);
  if (rows[0]?.image) {
    const f = path.join(__dirname, '../../uploads', rows[0].image);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
  res.json({ message: "O'chirildi" });
};
