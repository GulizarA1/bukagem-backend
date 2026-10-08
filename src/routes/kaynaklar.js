const express = require('express');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/kaynaklar — herkes görebilir
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM kaynaklar ORDER BY kategori, baslik');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// POST /api/kaynaklar — sadece yönetici ekleyebilir
router.post('/', requireAdmin, async (req, res) => {
  const { baslik, url, kategori, aciklama } = req.body || {};
  if (!baslik) { return res.status(400).json({ error: 'Başlık gerekli.' }); }
  try {
    const result = await pool.query(
      'INSERT INTO kaynaklar (baslik, url, kategori, aciklama) VALUES ($1,$2,$3,$4) RETURNING id',
      [baslik, url || '#', kategori || 'Genel', aciklama || '']
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// DELETE /api/kaynaklar/:id — sadece yönetici silebilir
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM kaynaklar WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { return res.status(404).json({ error: 'Kaynak bulunamadı.' }); }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
