const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/notes -> oturum açan kullanıcının kendi notları
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// POST /api/notes { title, content }
router.post('/', async (req, res) => {
  const { title, content } = req.body || {};
  if (!title) { return res.status(400).json({ error: 'Başlık gerekli.' }); }
  try {
    const result = await pool.query(
      'INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING id',
      [req.user.id, title, content || '']
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// PUT /api/notes/:id — sadece notun sahibi düzenleyebilir
router.put('/:id', async (req, res) => {
  const { title, content } = req.body || {};
  try {
    const result = await pool.query(
      'UPDATE notes SET title = COALESCE($1, title), content = COALESCE($2, content) WHERE id = $3 AND user_id = $4 RETURNING id',
      [title, content, req.params.id, req.user.id]
    );
    if (!result.rows[0]) { return res.status(404).json({ error: 'Not bulunamadı.' }); }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// DELETE /api/notes/:id — sadece notun sahibi silebilir
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) { return res.status(404).json({ error: 'Not bulunamadı.' }); }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
