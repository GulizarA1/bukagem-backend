// Demo kullanıcılar + birkaç örnek eylem kaydı oluşturur.
// Gerçek 50 eylem kaydınızı aktarmak için: npm run import-csv -- eylem_plani.csv
// (Mevcut artifact'teki "Dışa Aktar" butonuyla ürettiğiniz CSV dosyasını kullanın.)
const bcrypt = require('bcryptjs');
const pool = require('../src/db');

const SAMPLE_EYLEMLER = [
  { eksen: 'A. Yönetişim–KPI–PUKÖ', faaliyet: 'Kurumsal KPI çerçevesinin oluşturulması', sorumlu: 'Ahmet Yılmaz', oncelik: 'Kritik', baslangic: '2026-09-15', bitis: '2026-11-14', durum: 'Aktif', tamamlanma: 35 },
  { eksen: 'B. Mezun–İstihdam Analitiği', faaliyet: 'Mezun istihdam anketi altyapısının kurulması', sorumlu: 'Elif Kaya', oncelik: 'Yüksek', baslangic: '2026-09-15', bitis: '2026-12-01', durum: 'Planlandı', tamamlanma: 0 },
  { eksen: 'C. Kariyer Modeli 2.0–Mentörlük', faaliyet: 'Mentörlük eşleştirme platformunun tasarımı', sorumlu: 'Elif Kaya', oncelik: 'Orta', baslangic: '2026-10-01', bitis: '2027-01-15', durum: 'Planlandı', tamamlanma: 0 },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('kullanici123', 10);

    await client.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1,$2,$3,'admin'), ($4,$5,$6,'user')
       ON CONFLICT (email) DO NOTHING`,
      ['admin@bukagem.local', adminHash, 'Ahmet Yılmaz', 'user@bukagem.local', userHash, 'Elif Kaya']
    );

    for (const e of SAMPLE_EYLEMLER) {
      await client.query(
        `INSERT INTO eylemler (eksen, faaliyet, sorumlu, oncelik, baslangic, bitis, durum, tamamlanma)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [e.eksen, e.faaliyet, e.sorumlu, e.oncelik, e.baslangic, e.bitis, e.durum, e.tamamlanma]
      );
    }

    await client.query('COMMIT');
    console.log('Seed tamamlandı.');
    console.log('Yönetici girişi:    admin@bukagem.local / admin123');
    console.log('Kullanıcı girişi:   user@bukagem.local  / kullanici123');
    console.log('ÖNEMLİ: Bu şifreleri canlıya almadan önce değiştirin.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
