// Eylem Planı sayfasındaki "Dışa Aktar" butonuyla ürettiğiniz CSV dosyasını
// (No;Faaliyet;Eksen;Sorumlu;Öncelik;Başlangıç;Bitiş;Durum;Tamamlanma (%))
// okuyup veritabanına aktarır. Bu CSV'de bütçe/KPI/hedef gibi alanlar olmadığı
// için onlar varsayılan (boş/0) değerlerle oluşturulur — sonradan uygulama
// üzerinden düzenleyebilirsiniz.
//
// Kullanım: npm run import-csv -- /yol/eylem_plani.csv
const fs = require('fs');
const pool = require('../src/db');

const MONTH_TR = { 'Oca':1,'Şub':2,'Mar':3,'Nis':4,'May':5,'Haz':6,'Tem':7,'Ağu':8,'Eyl':9,'Eki':10,'Kas':11,'Ara':12 };

function parseTarih(s) {
  // "15 Eyl 2026" -> "2026-09-15"
  const m = s.trim().match(/^(\d{1,2})\s+([A-Za-zÇŞĞÜÖİçşğüöı]+)\s+(\d{4})$/);
  if (!m) { return null; }
  const day = m[1].padStart(2, '0');
  const month = String(MONTH_TR[m[2]] || 1).padStart(2, '0');
  return `${m[3]}-${month}-${day}`;
}

function parseCsv(text) {
  const clean = text.replace(/^﻿/, '');
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = lines.slice(1).map((line) => line.split(';'));
  return rows;
}

async function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Kullanım: npm run import-csv -- /yol/eylem_plani.csv');
    process.exit(1);
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(text);
  console.log(`${rows.length} satır bulundu, aktarılıyor...`);

  let ok = 0, skipped = 0;
  for (const cols of rows) {
    const [, faaliyet, eksen, sorumlu, oncelik, baslangic, bitis, durum, tamamlanma] = cols;
    if (!faaliyet || !eksen) { skipped++; continue; }
    try {
      await pool.query(
        `INSERT INTO eylemler (eksen, faaliyet, sorumlu, oncelik, baslangic, bitis, durum, tamamlanma)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          eksen, faaliyet, sorumlu || '', oncelik || 'Orta',
          parseTarih(baslangic || ''), parseTarih(bitis || ''),
          durum || 'Planlandı', parseInt(tamamlanma, 10) || 0,
        ]
      );
      ok++;
    } catch (err) {
      console.error('Satır atlandı:', faaliyet, err.message);
      skipped++;
    }
  }

  console.log(`Tamamlandı. Aktarılan: ${ok}, atlanan: ${skipped}.`);
  await pool.end();
}

run().catch((err) => {
  console.error('Import hatası:', err);
  process.exit(1);
});
