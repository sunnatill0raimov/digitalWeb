const pool = require('../config/db');

exports.list = async (req, res) => {
  const { search } = req.query;
  let q = 'SELECT * FROM customers';
  const p = [];
  if (search) {
    q += ' WHERE company_name ILIKE $1 OR contact_person ILIKE $1 OR phone ILIKE $1';
    p.push(`%${search}%`);
  }
  q += ' ORDER BY created_at DESC';
  const { rows } = await pool.query(q, p);
  res.json(rows);
};

exports.get = async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM customers WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Topilmadi' });
  res.json(rows[0]);
};

exports.create = async (req, res) => {
  const { company_name, contact_person, phone, address, debt, notes } = req.body;
  if (!company_name) return res.status(400).json({ message: 'Kompaniya nomi shart' });
  const { rows } = await pool.query(
    `INSERT INTO customers(company_name,contact_person,phone,address,debt,notes)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
    [company_name, contact_person || null, phone || null, address || null, debt || 0, notes || null]
  );
  res.status(201).json(rows[0]);
};

exports.update = async (req, res) => {
  const { company_name, contact_person, phone, address, debt, notes } = req.body;
  const { rows } = await pool.query(
    `UPDATE customers SET company_name=$1,contact_person=$2,phone=$3,
     address=$4,debt=$5,notes=$6 WHERE id=$7 RETURNING *`,
    [company_name, contact_person, phone, address, debt, notes, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Topilmadi' });
  res.json(rows[0]);
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM customers WHERE id=$1', [req.params.id]);
  res.json({ message: "O'chirildi" });
};
