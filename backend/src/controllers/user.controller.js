const pool   = require('../config/db');
const bcrypt = require('bcryptjs');

exports.list = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id,full_name,email,role,is_active,created_at FROM users ORDER BY created_at DESC'
  );
  res.json(rows);
};

exports.create = async (req, res) => {
  const { full_name, email, password, role } = req.body;
  if (!full_name || !email || !password || !role)
    return res.status(400).json({ message: 'Barcha maydonlar shart' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users(full_name,email,password,role)
       VALUES($1,$2,$3,$4)
       RETURNING id,full_name,email,role,is_active,created_at`,
      [full_name, email, hash, role]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'Bu email band' });
    res.status(500).json({ message: 'Server xatosi' });
  }
};

exports.update = async (req, res) => {
  const { full_name, email, role, password, is_active } = req.body;
  try {
    let q, p;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      q = 'UPDATE users SET full_name=$1,email=$2,role=$3,password=$4,is_active=$5 WHERE id=$6 RETURNING id,full_name,email,role,is_active';
      p = [full_name, email, role, hash, is_active ?? true, req.params.id];
    } else {
      q = 'UPDATE users SET full_name=$1,email=$2,role=$3,is_active=$4 WHERE id=$5 RETURNING id,full_name,email,role,is_active';
      p = [full_name, email, role, is_active ?? true, req.params.id];
    }
    const { rows } = await pool.query(q, p);
    res.json(rows[0]);
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

exports.remove = async (req, res) => {
  if (String(req.user.id) === String(req.params.id))
    return res.status(400).json({ message: "O'zingizni o'chira olmaysiz" });
  await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  res.json({ message: "O'chirildi" });
};
