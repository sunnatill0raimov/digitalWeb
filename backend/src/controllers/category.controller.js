const pool = require('../config/db');

exports.list   = async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY name');
  res.json(rows);
};
exports.create = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Nom shart' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO categories(name) VALUES($1) RETURNING *', [name]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'Mavjud' });
    res.status(500).json({ message: 'Xato' });
  }
};
exports.update = async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE categories SET name=$1 WHERE id=$2 RETURNING *', [req.body.name, req.params.id]
  );
  res.json(rows[0]);
};
exports.remove = async (req, res) => {
  await pool.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
  res.json({ message: "O'chirildi" });
};
