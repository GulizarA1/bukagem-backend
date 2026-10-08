// Migrations/ klasöründeki .sql dosyalarını sırayla veritabanına uygular.
const fs = require('fs');
const path = require('path');
const pool = require('../src/db');

async function migrate() {
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  if (files.length === 0) {
    console.log('Uygulanacak migration dosyası bulunamadı.');
    process.exit(0);
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`Uygulanıyor: ${file}`);
    await pool.query(sql);
  }

  console.log('Tüm migrationlar başarıyla uygulandı.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration hatası:', err);
  process.exit(1);
});
