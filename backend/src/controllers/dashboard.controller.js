const pool = require('../config/db');

exports.stats = async (req, res) => {
  try {
    const [
      customers, products, orders, revenue,
      lowStock, monthlySales, recentOrders, topProducts,
      ordersByStatus, monthlyRevenueTrend, topCustomers
    ] = await Promise.all([

      // Jami mijozlar
      pool.query('SELECT COUNT(*) FROM customers'),

      // Jami mahsulotlar
      pool.query('SELECT COUNT(*) FROM products'),

      // Jami buyurtmalar
      pool.query('SELECT COUNT(*) FROM orders'),

      // Yetkazilgan buyurtmalardan daromad
      pool.query(`
        SELECT COALESCE(SUM(total_amount),0) AS total
        FROM orders WHERE status='delivered'
      `),

      // Kam qolgan mahsulotlar
      pool.query(`
        SELECT p.id, p.name, p.sku, p.quantity, c.name AS category_name
        FROM products p LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.quantity <= 20
        ORDER BY p.quantity ASC LIMIT 8
      `),

      // 6 oylik oylik savdo
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month_key,
          EXTRACT(YEAR  FROM created_at) * 100 +
          EXTRACT(MONTH FROM created_at) AS sort_key,
          COALESCE(SUM(total_amount), 0)  AS total,
          COUNT(*) AS count
        FROM orders
        WHERE status != 'cancelled'
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY 1, 2, 3
        ORDER BY 3
      `),

      // Oxirgi 8 ta buyurtma
      pool.query(`
        SELECT o.id, o.total_amount, o.paid_amount, o.status, o.created_at,
               c.company_name AS customer_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        ORDER BY o.created_at DESC LIMIT 8
      `),

      // Top 5 mahsulot (30 kun)
      pool.query(`
        SELECT p.name, p.sku, SUM(oi.quantity) AS sold,
               SUM(oi.quantity * oi.price) AS revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders   o ON oi.order_id   = o.id
        WHERE o.status != 'cancelled'
          AND o.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY p.id, p.name, p.sku
        ORDER BY sold DESC LIMIT 5
      `),

      // Buyurtmalar status bo'yicha
      pool.query(`
        SELECT status, COUNT(*) AS count,
               COALESCE(SUM(total_amount), 0) AS total
        FROM orders
        GROUP BY status
        ORDER BY count DESC
      `),

      // 6 oylik har haftadagi trend (oy+hafta)
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
          EXTRACT(YEAR  FROM created_at) * 100 +
          EXTRACT(MONTH FROM created_at) AS sort_key,
          COALESCE(SUM(total_amount), 0)  AS revenue,
          COALESCE(SUM(paid_amount),  0)  AS paid,
          COUNT(*) AS orders_count
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY 1, 2
        ORDER BY 2
      `),

      // Top 5 mijoz (umumiy xarid)
      pool.query(`
        SELECT c.id, c.company_name,
               COUNT(o.id)              AS orders_count,
               COALESCE(SUM(o.total_amount), 0) AS total_spent
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
          AND o.status != 'cancelled'
        GROUP BY c.id, c.company_name
        ORDER BY total_spent DESC LIMIT 5
      `)
    ]);

    res.json({
      totalCustomers:    +customers.rows[0].count,
      totalProducts:     +products.rows[0].count,
      totalOrders:       +orders.rows[0].count,
      totalRevenue:      +revenue.rows[0].total,
      lowStockProducts:  lowStock.rows,
      monthlySales:      monthlySales.rows,
      recentOrders:      recentOrders.rows,
      topProducts:       topProducts.rows,
      ordersByStatus:    ordersByStatus.rows,
      monthlyRevenueTrend: monthlyRevenueTrend.rows,
      topCustomers:      topCustomers.rows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server xatosi' });
  }
};
