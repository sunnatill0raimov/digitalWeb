require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool   = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ─── 1. USERS (10 ta) ────────────────────────────────────────────────────
    const password = await bcrypt.hash('password123', 10);
    const users = [
      ['Jasur Karimov',    'jasur@crm.uz',    'manager'],
      ['Malika Yusupova',  'malika@crm.uz',   'manager'],
      ['Bobur Toshmatov',  'bobur@crm.uz',    'warehouse'],
      ['Nilufar Hasanova', 'nilufar@crm.uz',  'manager'],
      ['Sardor Ergashev',  'sardor@crm.uz',   'warehouse'],
      ['Zulfiya Nazarova', 'zulfiya@crm.uz',  'manager'],
      ['Otabek Mirzoev',   'otabek@crm.uz',   'warehouse'],
      ['Feruza Sobirov',   'feruza@crm.uz',   'manager'],
      ['Sherzod Alimov',   'sherzod@crm.uz',  'warehouse'],
      ['Dildora Rahimova', 'dildora@crm.uz',  'manager'],
    ];
    for (const [full_name, email, role] of users) {
      await client.query(
        `INSERT INTO users (full_name, email, password, role)
         VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING`,
        [full_name, email, password, role]
      );
    }
    console.log('✅ Users qo\'shildi');

    // ─── 2. CUSTOMERS (10 ta) ────────────────────────────────────────────────
    const customers = [
      ['Textile House',      'Akbar Qodirov',    '+998901234567', 'Toshkent, Yunusobod',   0,       'VIP mijoz'],
      ['Fashion World',      'Barno Umarova',    '+998902345678', 'Samarqand, Registon',    500000,  ''],
      ['Style Center',       'Vohid Nishonov',   '+998903456789', 'Buxoro, Markaziy',       0,       'Doimiy mijoz'],
      ['Trend Shop',         'Gulnora Sotvoldiv','+998904567890', 'Namangan, Bozor ko\'ch', 1200000, 'Qarz bor'],
      ['City Clothes',       'Hamid Tursunov',   '+998905678901', 'Farg\'ona, Mustaqillik', 0,       ''],
      ['Modern Wear',        'Iroda Kalandarova','+998906789012', 'Andijon, Asaka ko\'ch',  750000,  ''],
      ['Elite Fashion',      'Jamshid Xolmatov', '+998907890123', 'Toshkent, Chilonzor',    0,       'VIP mijoz'],
      ['Comfort Store',      'Kamola Yuldasheva','+998908901234', 'Qo\'qon, Markaziy',      300000,  ''],
      ['Best Textile',       'Laziz Abdullayev', '+998909012345', 'Jizzax, Sharq ko\'ch',   0,       'Yangi mijoz'],
      ['Grand Clothes',      'Maftuna Baxtiyorova','+998901122334','Toshkent, Shayxontohur',0,       ''],
    ];
    for (const [company_name, contact_person, phone, address, debt, notes] of customers) {
      await client.query(
        `INSERT INTO customers (company_name, contact_person, phone, address, debt, notes)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [company_name, contact_person, phone, address, debt, notes]
      );
    }
    console.log('✅ Customers qo\'shildi');

    // ─── 3. CATEGORIES (mavjudlarini olish) ──────────────────────────────────
    const { rows: catRows } = await client.query('SELECT id, name FROM categories');
    const catMap = {};
    catRows.forEach(r => { catMap[r.name] = r.id; });

    // ─── 4. PRODUCTS (10 ta) ─────────────────────────────────────────────────
    const products = [
      ['Erkaklar kiyimi',  'Klassik Kostyum',       'SKU-001', 450000,  25],
      ['Ayollar kiyimi',   'Yozgi Ko\'ylak',         'SKU-002', 180000,  60],
      ['Bolalar kiyimi',   'Bolalar Kombinezon',     'SKU-003', 120000,  40],
      ['Sport kiyimlari',  'Sport Trenirovka Seti',  'SKU-004', 220000,  35],
      ['Shimlar',          'Jinsi Shim (erkak)',     'SKU-005', 160000,  80],
      ['Shimlar',          'Jinsi Shim (ayol)',      'SKU-006', 155000,  75],
      ['Kurtaklar',        'Charm Kurtak',           'SKU-007', 380000,  20],
      ['Paltolar',         'Qishki Palto',           'SKU-008', 650000,  15],
      ['Futbolkalar',      'Oddiy Futbolka',         'SKU-009',  55000, 150],
      ['Erkaklar kiyimi',  'Klassik Ko\'ylak',       'SKU-010', 130000,  50],
    ];
    const productIds = [];
    for (const [catName, name, sku, price, quantity] of products) {
      const catId = catMap[catName] || null;
      const { rows } = await client.query(
        `INSERT INTO products (category_id, name, sku, price, quantity, unit)
         VALUES ($1,$2,$3,$4,$5,'dona')
         ON CONFLICT (sku) DO UPDATE SET price=EXCLUDED.price
         RETURNING id`,
        [catId, name, sku, price, quantity]
      );
      productIds.push(rows[0].id);
    }
    console.log('✅ Products qo\'shildi');

    // ─── 5. ORDERS (10 ta) ───────────────────────────────────────────────────
    const { rows: custRows } = await client.query('SELECT id FROM customers ORDER BY id');
    const { rows: userRows } = await client.query("SELECT id FROM users WHERE role IN ('admin','manager') ORDER BY id");

    const orderStatuses = ['pending','processing','shipped','delivered','cancelled'];
    for (let i = 0; i < 10; i++) {
      const custId = custRows[i % custRows.length].id;
      const userId = userRows[i % userRows.length].id;
      const status = orderStatuses[i % orderStatuses.length];
      const prodId = productIds[i];

      const qty     = Math.floor(Math.random() * 5) + 1;
      const price   = products[i][3];
      const total   = qty * price;
      const paid    = status === 'delivered' ? total : Math.floor(total * 0.5);

      const { rows: ordRows } = await client.query(
        `INSERT INTO orders (customer_id, user_id, total_amount, paid_amount, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [custId, userId, total, paid, status, `Test buyurtma #${i + 1}`]
      );
      const orderId = ordRows[0].id;

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1,$2,$3,$4)`,
        [orderId, prodId, qty, price]
      );
    }
    console.log('✅ Orders qo\'shildi');

    // ─── 6. INVENTORY LOGS (10 ta) ───────────────────────────────────────────
    const { rows: warehouseUsers } = await client.query(
      "SELECT id FROM users WHERE role IN ('admin','warehouse') ORDER BY id"
    );
    const types = ['in','out'];
    for (let i = 0; i < 10; i++) {
      const prodId = productIds[i];
      const userId = warehouseUsers[i % warehouseUsers.length].id;
      const type   = types[i % 2];
      const qty    = Math.floor(Math.random() * 20) + 5;
      await client.query(
        `INSERT INTO inventory_logs (product_id, user_id, type, quantity, note)
         VALUES ($1,$2,$3,$4,$5)`,
        [prodId, userId, type, qty, `${type === 'in' ? 'Qabul' : 'Chiqim'} #${i + 1}`]
      );
    }
    console.log('✅ Inventory logs qo\'shildi');

    await client.query('COMMIT');
    console.log('\n🎉 Seed muvaffaqiyatli yakunlandi!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed xatosi:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
