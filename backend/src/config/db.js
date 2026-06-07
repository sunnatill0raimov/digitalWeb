const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ||
       process.env.DATABASE_URL?.includes('neon.tech') ||
       process.env.DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : false
});

pool.on('connect', () => console.log('✅ PostgreSQL ulandi'));
pool.on('error', (err) => console.error('❌ DB xatosi:', err.message));

module.exports = pool;
