const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('HATA: DATABASE_URL tanımlı değil. .env dosyanızı kontrol edin (.env.example\'a bakın).');
  process.exit(1);
}

// Çoğu barındırma servisi (Railway, Render, Supabase) SSL gerektirir.
// Yerel geliştirmede SSL kapalıysa otomatik algılanır.
const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Beklenmeyen veritabanı hatası:', err);
});

module.exports = pool;
