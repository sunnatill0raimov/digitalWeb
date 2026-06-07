const pool = require('../config/db');

exports.stats = async (req, res) => {
  try {
    const [
      customers, products, orders, revenue,
      lowStock, monthlySales, recentOrders, topProducts
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM customers'),
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query(`
        SELECT COALESCE(SUM(total_amount),0) AS total
        FROM orders WHERE status='delivered'
      `),
      pool.query(`
        SELECT p.id,p.name,p.sku,p.quantity,c.name AS category_name
        FROM products p LEFT JOIN categories c ON p.category_id=c.id
        WHERE p.quantity<=10 ORDER BY p.quantity ASC LIMIT 8
      `),
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month',created_at),'Mon YYYY') AS month,
               EXTRACT(YEAR FROM created_at)*100 +
               EXTRACT(MONTH FROM created_at) AS sort_key,
               COALESCE(SUM(total_amount),0) AS total,
               COUNT(*) AS count
        FROM orders WHERE status!='cancelled'
          AND created_at >= NOW()-INTERVAL '6 months'
        GROUP BY 1,2 ORDER BY 2
      `),
      pool.query(`
        SELECT o.id,o.total_amount,o.status,o.created_at,
               c.company_name AS customer_name
        FROM orders o LEFT JOIN customers c ON o.customer_id=c.id
        ORDER BY o.created_at DESC LIMIT 5
      `),
      pool.query(`
        SELECT p.name,p.sku,SUM(oi.quantity) AS sold
        FROM order_items oi
        JOIN products p ON oi.product_id=p.id
        JOIN orders   o ON oi.order_id=o.id
        WHERE o.status!='cancelled'
          AND o.created_at >= NOW()-INTERVAL '30 days'
        GROUP BY p.id ORDER BY sold DESC LIMIT 5
      `)
    ]);

    res.json({
      totalCustomers: +customers.rows[0].count,
      totalProducts:  +products.rows[0].count,
      totalOrders:    +orders.rows[0].count,
      totalRevenue:   +revenue.rows[0].total,
      lowStockProducts: lowStock.rows,
      monthlySales:     monthlySales.rows,
      recentOrders:     recentOrders.rows,
      topProducts:      topProducts.rows
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server xatosi' });
  }
};
