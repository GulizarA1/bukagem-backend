const express = require('express');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const COLUMNS = `
  no, eksen, faaliyet, sorumlu, destek, oncelik, baslangic, bitis, durum, tamamlanma,
  kpi, hedef, gecikme_nedeni AS "gecikmeNedeni", butce_sinifi AS "butceSinifi",
  butce_kaynagi AS "butceKaynagi", planlanan_butce AS "planlananButce",
  gerceklesen_butce AS "gerceklesenButce", butce_gerceklesme AS "butceGerceklesme",
  sapma, yayin_ciktisi AS "yayinCiktisi", proje_ciktisi AS "projeCiktisi",
  puko_kaniti AS "pukoKaniti", frekans, kaynak
`;

// GET /api/eylemler?eksen=...&durum=...&oncelik=...&q=...
router.get('/', async (req, res) => {
  const { eksen, durum, oncelik, q } = req.query;
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (eksen) { params.push(eksen); conditions.push(`eksen = $${params.length}`); }
  if (durum) { params.push(durum); conditions.push(`durum = $${params.length}`); }
  if (oncelik) { params.push(oncelik); conditions.push(`oncelik = $${params.length}`); }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(faaliyet ILIKE $${params.length} OR sorumlu ILIKE $${params.length})`);
  }

  const sql = `SELECT ${COLUMNS} FROM eylemler WHERE ${conditions.join(' AND ')} ORDER BY no ASC`;
  try {
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// GET /api/eylemler/:no
router.get('/:no', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${COLUMNS} FROM eylemler WHERE no = $1 AND deleted_at IS NULL`,
      [req.params.no]
    );
    if (!result.rows[0]) { return res.status(404).json({ error: 'Eylem bulunamadı.' }); }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// POST /api/eylemler (sadece yönetici yeni eylem ekleyebilir)
router.post('/', requireAdmin, async (req, res) => {
  const b = req.body || {};
  if (!b.eksen || !b.faaliyet) {
    return res.status(400).json({ error: 'Eksen ve faaliyet alanları gerekli.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO eylemler
        (eksen, faaliyet, sorumlu, destek, oncelik, baslangic, bitis, durum, tamamlanma,
         kpi, hedef, gecikme_nedeni, butce_sinifi, butce_kaynagi, planlanan_butce,
         gerceklesen_butce, butce_gerceklesme, sapma, yayin_ciktisi, proje_ciktisi,
         puko_kaniti, frekans, kaynak)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING no`,
      [
        b.eksen, b.faaliyet, b.sorumlu || '', b.destek || '', b.oncelik || 'Orta',
        b.baslangic || null, b.bitis || null, b.durum || 'Planlandı', b.tamamlanma || 0,
        b.kpi || '', b.hedef || '', b.gecikmeNedeni || '', b.butceSinifi || '',
        b.butceKaynagi || '', b.planlananButce || 0, b.gerceklesenButce || 0,
        b.butceGerceklesme || 0, b.sapma || 0, b.yayinCiktisi || '', b.projeCiktisi || '',
        b.pukoKaniti || '', b.frekans || '', b.kaynak || '#',
      ]
    );
    res.status(201).json({ no: result.rows[0].no });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// PUT /api/eylemler/:no (yönetici ve kullanıcı düzenleyebilir — artifact'teki davranışla aynı)
router.put('/:no', async (req, res) => {
  const b = req.body || {};
  const fields = {
    durum: b.durum, tamamlanma: b.tamamlanma, planlanan_butce: b.planlananButce,
    gerceklesen_butce: b.gerceklesenButce, butce_gerceklesme: b.butceGerceklesme,
    gecikme_nedeni: b.gecikmeNedeni, sapma: b.sapma,
  };
  const setClauses = [];
  const params = [];
  for (const [col, val] of Object.entries(fields)) {
    if (val !== undefined) {
      params.push(val);
      setClauses.push(`${col} = $${params.length}`);
    }
  }
  if (setClauses.length === 0) {
    return res.status(400).json({ error: 'Güncellenecek alan gönderilmedi.' });
  }
  params.push(req.params.no);

  try {
    const result = await pool.query(
      `UPDATE eylemler SET ${setClauses.join(', ')} WHERE no = $${params.length} AND deleted_at IS NULL RETURNING no`,
      params
    );
    if (!result.rows[0]) { return res.status(404).json({ error: 'Eylem bulunamadı.' }); }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// DELETE /api/eylemler/:no (soft delete — artifact'teki deleteEylem ile aynı mantık)
router.delete('/:no', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE eylemler SET deleted_at = now() WHERE no = $1 AND deleted_at IS NULL RETURNING no',
      [req.params.no]
    );
    if (!result.rows[0]) { return res.status(404).json({ error: 'Eylem bulunamadı.' }); }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
