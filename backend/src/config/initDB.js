const pool = require('./db');
const bcrypt = require('bcryptjs');

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        full_name   VARCHAR(100) NOT NULL,
        email       VARCHAR(100) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        role        VARCHAR(20)  NOT NULL DEFAULT 'manager'
                    CHECK (role IN ('admin','manager','warehouse')),
        is_active   BOOLEAN DEFAULT true,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id              SERIAL PRIMARY KEY,
        company_name    VARCHAR(150) NOT NULL,
        contact_person  VARCHAR(100),
        phone           VARCHAR(30),
        address         TEXT,
        debt            NUMERIC(15,2) DEFAULT 0,
        notes           TEXT,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id    SERIAL PRIMARY KEY,
        name  VARCHAR(100) UNIQUE NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id          SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        name        VARCHAR(200) NOT NULL,
        sku         VARCHAR(80)  UNIQUE NOT NULL,
        price       NUMERIC(15,2) NOT NULL DEFAULT 0,
        quantity    INTEGER       NOT NULL DEFAULT 0,
        unit        VARCHAR(30)   DEFAULT 'dona',
        image       VARCHAR(255),
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id           SERIAL PRIMARY KEY,
        customer_id  INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        user_id      INTEGER REFERENCES users(id)     ON DELETE SET NULL,
        total_amount NUMERIC(15,2) DEFAULT 0,
        paid_amount  NUMERIC(15,2) DEFAULT 0,
        status       VARCHAR(30) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
        notes        TEXT,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id          SERIAL PRIMARY KEY,
        order_id    INTEGER REFERENCES orders(id)   ON DELETE CASCADE,
        product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
        quantity    INTEGER        NOT NULL,
        price       NUMERIC(15,2)  NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id          SERIAL PRIMARY KEY,
        product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
        user_id     INTEGER REFERENCES users(id)    ON DELETE SET NULL,
        type        VARCHAR(10) NOT NULL CHECK (type IN ('in','out')),
        quantity    INTEGER     NOT NULL,
        note        TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Default admin
    const exists = await client.query(
      "SELECT id FROM users WHERE email='admin@crm.uz'"
    );
    if (exists.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await client.query(
        "INSERT INTO users (full_name,email,password,role) VALUES($1,$2,$3,$4)",
        ['Super Admin', 'admin@crm.uz', hash, 'admin']
      );
      console.log('👤 Default admin yaratildi: admin@crm.uz / admin123');
    }

    // Default categories
    const cats = [
      "Erkaklar kiyimi", "Ayollar kiyimi", "Bolalar kiyimi",
      "Sport kiyimlari", "Shimlar",        "Kurtaklar",
      "Paltolar",        "Futbolkalar",    "Ichki kiyim",
      "Poyabzal",        "Sumkalar",       "Aksessuarlar",
      "Yozgi kollekciya","Qishki kollekciya","Milliy kiyim",
    ];
    for (const c of cats) {
      await client.query(
        'INSERT INTO categories(name) VALUES($1) ON CONFLICT(name) DO NOTHING', [c]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Database tayyor');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ initDB xatosi:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = initDB;
