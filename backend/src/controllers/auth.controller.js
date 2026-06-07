const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email va parol kiritilsin' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND is_active=true', [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Email yoki parol noto'g'ri" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Email yoki parol noto'g'ri" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server xatosi' });
  }
};

exports.me = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,full_name,email,role,created_at FROM users WHERE id=$1', [req.user.id]
    );
    res.json(rows[0] || null);
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};
