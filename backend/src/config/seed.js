require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./db');
const bcrypt = require('bcryptjs');

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function dateInMonth(monthOffset) {
  const d = new Date();
  d.setDate(rnd(1, 28));
  d.setHours(rnd(8, 21), rnd(0, 59), 0, 0);
  d.setMonth(d.getMonth() + monthOffset);
  return d.toISOString();
}

async function run(sql, params = []) {
  const client = await pool.connect();
  try { return await client.query(sql, params); }
  finally { client.release(); }
}

async function seed() {
  console.log('🚀 Seed boshlandi...\n');

  // ── 1. CATEGORIES ──────────────────────────────────────────────────────────
  const newCats = [
    'Erkaklar kiyimi', 'Ayollar kiyimi', 'Bolalar kiyimi',
    'Sport kiyimlari', 'Shimlar',        'Kurtaklar',
    'Paltolar',        'Futbolkalar',    'Ichki kiyim',
    'Poyabzal',        'Sumkalar',       'Aksessuarlar',
    'Yozgi kollekciya','Qishki kollekciya','Milliy kiyim',
  ];
  for (const c of newCats) {
    await run('INSERT INTO categories(name) VALUES($1) ON CONFLICT(name) DO NOTHING', [c]);
  }
  const { rows: catRows } = await run('SELECT id, name FROM categories');
  const catMap = {};
  catRows.forEach(r => { catMap[r.name] = r.id; });
  console.log(`✅ Kategoriyalar: ${catRows.length} ta`);

  // ── 2. USERS ───────────────────────────────────────────────────────────────
  const password = await bcrypt.hash('password123', 10);
  const userList = [
    ['Jasur Karimov',    'jasur@crm.uz',   'manager'],
    ['Malika Yusupova',  'malika@crm.uz',  'manager'],
    ['Bobur Toshmatov',  'bobur@crm.uz',   'warehouse'],
    ['Nilufar Hasanova', 'nilufar@crm.uz', 'manager'],
    ['Sardor Ergashev',  'sardor@crm.uz',  'warehouse'],
    ['Zulfiya Nazarova', 'zulfiya@crm.uz', 'manager'],
    ['Otabek Mirzoev',   'otabek@crm.uz',  'warehouse'],
    ['Feruza Sobirov',   'feruza@crm.uz',  'manager'],
    ['Azizbek Normatov', 'aziz@crm.uz',    'manager'],
    ['Mohira Tursunova', 'mohira@crm.uz',  'warehouse'],
  ];
  for (const [fn, em, role] of userList) {
    await run(
      `INSERT INTO users(full_name,email,password,role) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING`,
      [fn, em, password, role]
    );
  }
  console.log(`✅ Foydalanuvchilar: ${userList.length} ta`);

  // ── 3. CUSTOMERS ───────────────────────────────────────────────────────────
  // Avval eski test ma'lumotlarni tozalaymiz
  await run(`DELETE FROM inventory_logs`);
  await run(`DELETE FROM order_items`);
  await run(`DELETE FROM orders`);
  await run(`DELETE FROM customers`);
  console.log('🗑  Eski ma\'lumotlar tozalandi');

  const custData = [
    ['Textile House',     'Akbar Qodirov',       '+998901234567', 'Toshkent, Yunusobod',    0,       'VIP mijoz'],
    ['Fashion World',     'Barno Umarova',        '+998902345678', 'Samarqand, Registon',    500000,  ''],
    ['Style Center',      'Vohid Nishonov',       '+998903456789', 'Buxoro, Markaziy',       0,       'Doimiy mijoz'],
    ['Trend Shop',        'Gulnora Sotvoldiev',   '+998904567890', 'Namangan, Bozor',        1200000, 'Qarz bor'],
    ['City Clothes',      'Hamid Tursunov',       '+998905678901', 'Fargona, Mustaqillik',   0,       ''],
    ['Modern Wear',       'Iroda Kalandarova',    '+998906789012', 'Andijon, Asaka',         750000,  ''],
    ['Elite Fashion',     'Jamshid Xolmatov',     '+998907890123', 'Toshkent, Chilonzor',    0,       'VIP mijoz'],
    ['Comfort Store',     'Kamola Yuldasheva',    '+998908901234', 'Qoqon, Markaziy',        300000,  ''],
    ['Best Textile',      'Laziz Abdullayev',     '+998909012345', 'Jizzax, Sharq',          0,       'Yangi mijoz'],
    ['Grand Clothes',     'Maftuna Baxtiyorova',  '+998901122334', 'Toshkent, Shayxontohur', 0,       ''],
    ['Nova Style',        'Nodir Hasanov',         '+998911223344', 'Toshkent, Mirzo Ulugbek',0,      'VIP mijoz'],
    ['Al-Baraka Tekstil', 'Ozoda Mirzayeva',       '+998912334455', 'Samarqand, Ulugbek',    200000,  ''],
    ['Premium Wear',      'Parviz Umarov',         '+998913445566', 'Toshkent, Uchtepa',     0,       'Doimiy mijoz'],
    ['Royal Fashion',     'Qunduz Raxmatova',      '+998914556677', 'Namangan, Yangi hayot', 900000,  'Qarz bor'],
    ['Star Clothes',      'Rustam Nishonov',       '+998915667788', 'Fargona, Dostlik',      0,       ''],
    ['Top Textile',       'Sitora Yusupova',       '+998916778899', 'Buxoro, Shahrisabz',    0,       ''],
    ['Mega Store',        'Tohir Salimov',         '+998917889900', 'Toshkent, Sergeli',     450000,  ''],
    ['Golden Fashion',    'Umida Nazarova',        '+998918990011', 'Andijon, Markaziy',     0,       'Yangi mijoz'],
    ['Perfect Wear',      'Valijon Xojayev',       '+998919001122', 'Qoqon, Yangi bozor',    0,       ''],
    ['Classic Clothes',   'Xurshid Toshpulatov',   '+998920112233', 'Toshkent, Olmazor',     0,       'VIP mijoz'],
  ];
  // Batch insert customers with unnest
  const custIds = [];
  for (const [cn, cp, ph, adr, debt, notes] of custData) {
    const { rows } = await run(
      `INSERT INTO customers(company_name,contact_person,phone,address,debt,notes)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
      [cn, cp, ph, adr, debt, notes]
    );
    custIds.push(rows[0].id);
  }
  console.log(`✅ Mijozlar: ${custIds.length} ta`);

  // ── 4. PRODUCTS (50 ta) ────────────────────────────────────────────────────
  await run(`DELETE FROM products`);

  const prodList = [
    // Erkaklar kiyimi (8 ta)
    ['Erkaklar kiyimi',    'Klassik Kostyum qora',          'SKU-001', 450000,  25],
    ['Erkaklar kiyimi',    'Klassik Kostyum kulrang',       'SKU-002', 480000,  20],
    ['Erkaklar kiyimi',    'Klassik Koylak oq',             'SKU-003', 130000,  80],
    ['Erkaklar kiyimi',    'Klassik Koylak ko\'k',          'SKU-004', 135000,  70],
    ['Erkaklar kiyimi',    'Erkaklar Galstuk Toplami',      'SKU-005',  85000,  60],
    ['Erkaklar kiyimi',    'Erkaklar Jileti',               'SKU-006', 220000,  35],
    ['Erkaklar kiyimi',    'Yozgi Qisqa Shim erkak',        'SKU-007',  95000,  90],
    ['Erkaklar kiyimi',    'Erkaklar Pijama',               'SKU-008', 145000,  45],
    // Ayollar kiyimi (8 ta)
    ['Ayollar kiyimi',     'Yozgi Koylak gul naqshli',      'SKU-009', 180000,  60],
    ['Ayollar kiyimi',     'Kechki Koylak qizil',           'SKU-010', 320000,  30],
    ['Ayollar kiyimi',     'Kechki Koylak qora',            'SKU-011', 350000,  25],
    ['Ayollar kiyimi',     'Ayollar Bluzasi',               'SKU-012', 120000,  75],
    ['Ayollar kiyimi',     'Ayollar Yubkasi midi',          'SKU-013', 150000,  55],
    ['Ayollar kiyimi',     'Ayollar Yubkasi maxi',          'SKU-014', 175000,  40],
    ['Ayollar kiyimi',     'Ayollar Kardigani',             'SKU-015', 195000,  50],
    ['Ayollar kiyimi',     'Ayollar Kostyumi',              'SKU-016', 420000,  18],
    // Bolalar kiyimi (6 ta)
    ['Bolalar kiyimi',     'Bolalar Kombinezon 0-1 yosh',   'SKU-017', 120000,  40],
    ['Bolalar kiyimi',     'Maktab Formasi ogil',           'SKU-018',  95000,  55],
    ['Bolalar kiyimi',     'Maktab Formasi qiz',            'SKU-019',  98000,  50],
    ['Bolalar kiyimi',     'Bolalar Futbolkasi',            'SKU-020',  45000, 100],
    ['Bolalar kiyimi',     'Bolalar Sport Kiyimi',          'SKU-021',  85000,  65],
    ['Bolalar kiyimi',     'Bolalar Paltosi',               'SKU-022', 280000,  22],
    // Sport kiyimlari (6 ta)
    ['Sport kiyimlari',    'Sport Trenirovka Seti erkak',   'SKU-023', 220000,  35],
    ['Sport kiyimlari',    'Sport Trenirovka Seti ayol',    'SKU-024', 215000,  40],
    ['Sport kiyimlari',    'Velosiped Shorty',              'SKU-025',  85000,  90],
    ['Sport kiyimlari',    'Yoga Legingi',                  'SKU-026',  95000,  80],
    ['Sport kiyimlari',    'Sport Koylagi dri-fit',         'SKU-027',  75000, 110],
    ['Sport kiyimlari',    'Tennis Kiyimi Toplami',         'SKU-028', 185000,  28],
    // Shimlar (6 ta)
    ['Shimlar',            'Jinsi Shim erkak slim fit',     'SKU-029', 160000,  80],
    ['Shimlar',            'Jinsi Shim ayol skinny',        'SKU-030', 155000,  75],
    ['Shimlar',            'Jinsi Shim ayol mom jeans',     'SKU-031', 165000,  60],
    ['Shimlar',            'Klassik Shim erkak qora',       'SKU-032', 185000,  50],
    ['Shimlar',            'Klassik Shim erkak jigarrang',  'SKU-033', 190000,  45],
    ['Shimlar',            'Yozgi Kargo Shim',              'SKU-034', 140000,  70],
    // Kurtaklar (4 ta)
    ['Kurtaklar',          'Charm Kurtak erkak',            'SKU-035', 380000,  20],
    ['Kurtaklar',          'Charm Kurtak ayol',             'SKU-036', 360000,  18],
    ['Kurtaklar',          'Yengil Kurtak bahor',           'SKU-037', 210000,  45],
    ['Kurtaklar',          'Harbiy Uslub Kurtak',           'SKU-038', 290000,  30],
    // Paltolar (3 ta)
    ['Paltolar',           'Qishki Palto erkak uzun',       'SKU-039', 650000,  15],
    ['Paltolar',           'Qishki Palto ayol qisqa',       'SKU-040', 580000,  12],
    ['Paltolar',           'Demiseson Palto',               'SKU-041', 420000,  20],
    // Futbolkalar (4 ta)
    ['Futbolkalar',        'Oddiy Futbolka oq',             'SKU-042',  55000, 150],
    ['Futbolkalar',        'Oddiy Futbolka qora',           'SKU-043',  55000, 140],
    ['Futbolkalar',        'Polo Futbolka',                 'SKU-044',  75000, 120],
    ['Futbolkalar',        'Oversize Futbolka',             'SKU-045',  85000,  95],
    // Poyabzal (3 ta)
    ['Poyabzal',           'Erkaklar Charm Tufli',          'SKU-046', 480000,  30],
    ['Poyabzal',           'Ayollar Baland Poshnali',       'SKU-047', 390000,  25],
    ['Poyabzal',           'Sport Krossovka',               'SKU-048', 320000,  45],
    // Milliy kiyim (2 ta)
    ['Milliy kiyim',       'Erkaklar Choponi',              'SKU-049', 550000,  15],
    ['Milliy kiyim',       'Ayollar Atlas Koylagi',         'SKU-050', 480000,  18],
  ];

  // Barcha productlarni bitta transaction da insert
  {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const prodIds = [];
      for (const [catName, name, sku, price, qty] of prodList) {
        const catId = catMap[catName] || null;
        const { rows } = await client.query(
          `INSERT INTO products(category_id,name,sku,price,quantity,unit)
           VALUES($1,$2,$3,$4,$5,'dona')
           ON CONFLICT(sku) DO UPDATE SET
             name=EXCLUDED.name, price=EXCLUDED.price,
             quantity=EXCLUDED.quantity, category_id=EXCLUDED.category_id
           RETURNING id`,
          [catId, name, sku, price, qty]
        );
        prodIds.push(rows[0].id);
      }
      await client.query('COMMIT');
      console.log(`✅ Mahsulotlar: ${prodIds.length} ta`);

      // ── 5. ORDERS (6 oy) ────────────────────────────────────────────────────
      const { rows: mgrs } = await client.query(
        "SELECT id FROM users WHERE role IN ('admin','manager') ORDER BY id"
      );
      const { rows: whs } = await client.query(
        "SELECT id FROM users WHERE role IN ('admin','warehouse') ORDER BY id"
      );

      const monthCounts = [8, 12, 10, 15, 18, 22]; // 85 ta jami
      const statusPool  = ['pending','processing','shipped','delivered','delivered','delivered','cancelled'];

      let orderN = 1;
      for (let m = 0; m < 6; m++) {
        const off = m - 5;
        const cnt = monthCounts[m];
        await client.query('BEGIN');

        for (let i = 0; i < cnt; i++) {
          const cid    = custIds[rnd(0, custIds.length - 1)];
          const uid    = mgrs[rnd(0, mgrs.length - 1)].id;
          const status = statusPool[rnd(0, statusPool.length - 1)];

          const items = [];
          const used  = new Set();
          const nItems = rnd(1, 4);
          for (let k = 0; k < nItems; k++) {
            let idx;
            do { idx = rnd(0, prodIds.length - 1); } while (used.has(idx));
            used.add(idx);
            items.push({ pid: prodIds[idx], qty: rnd(2, 12), price: prodList[idx][3] });
          }

          const total = items.reduce((s, x) => s + x.qty * x.price, 0);
          const paid  = status === 'delivered' ? total
                      : status === 'cancelled' ? 0
                      : Math.floor(total * rnd(30, 80) / 100);

          const { rows: oR } = await client.query(
            `INSERT INTO orders(customer_id,user_id,total_amount,paid_amount,status,notes,created_at)
             VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
            [cid, uid, total, paid, status, `Buyurtma #${orderN++}`, dateInMonth(off)]
          );
          const oid = oR[0].id;
          for (const it of items) {
            await client.query(
              `INSERT INTO order_items(order_id,product_id,quantity,price) VALUES($1,$2,$3,$4)`,
              [oid, it.pid, it.qty, it.price]
            );
          }
        }
        await client.query('COMMIT');
        console.log(`  📦 Oy ${m + 1}/6: ${cnt} buyurtma ✓`);
      }
      console.log(`✅ Buyurtmalar jami: ${orderN - 1} ta`);

      // ── 6. INVENTORY LOGS (6 oy) ────────────────────────────────────────────
      await client.query('BEGIN');
      for (let m = 0; m < 6; m++) {
        const off = m - 5;
        for (let i = 0; i < rnd(5, 9); i++) {
          await client.query(
            `INSERT INTO inventory_logs(product_id,user_id,type,quantity,note,created_at)
             VALUES($1,$2,'in',$3,$4,$5)`,
            [prodIds[rnd(0, prodIds.length-1)], whs[rnd(0,whs.length-1)].id,
             rnd(20,100), `Kirim yetkazma ${m+1}-${i+1}`, dateInMonth(off)]
          );
        }
        for (let i = 0; i < rnd(4, 7); i++) {
          await client.query(
            `INSERT INTO inventory_logs(product_id,user_id,type,quantity,note,created_at)
             VALUES($1,$2,'out',$3,$4,$5)`,
            [prodIds[rnd(0, prodIds.length-1)], whs[rnd(0,whs.length-1)].id,
             rnd(5,40), `Chiqim buyurtma ${m+1}-${i+1}`, dateInMonth(off)]
          );
        }
      }
      await client.query('COMMIT');
      console.log('✅ Inventar loglari (6 oy)');

    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  console.log('\n🎉 Seed muvaffaqiyatli yakunlandi!');
  console.log('═══════════════════════════════════');
  console.log('  Kategoriyalar : 15 ta');
  console.log('  Mahsulotlar   : 50 ta');
  console.log('  Mijozlar      : 20 ta');
  console.log('  Buyurtmalar   : ~85 ta (6 oy)');
  console.log('═══════════════════════════════════');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Xato:', err.message);
  process.exit(1);
});
