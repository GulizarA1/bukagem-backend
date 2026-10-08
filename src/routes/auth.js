const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login { email, password } -> { token, user }
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre gerekli.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'E-posta veya şifre yanlış.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'E-posta veya şifre yanlış.' });
    }

    const payload = { id: user.id, email: user.email, role: user.role, full_name: user.full_name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// GET /api/auth/me -> geçerli token'ın sahibi
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/me { full_name?, password?, currentPassword? } -> profili güncelle
// Şifre değiştirmek için currentPassword doğrulanır.
router.put('/me', requireAuth, async (req, res) => {
  const { full_name, password, currentPassword } = req.body || {};

  try {
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Şifre değiştirmek için mevcut şifrenizi girin.' });
      }
      const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      const ok = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!ok) { return res.status(401).json({ error: 'Mevcut şifre yanlış.' }); }
      const newHash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);
    }

    if (full_name) {
      await pool.query('UPDATE users SET full_name = $1 WHERE id = $2', [full_name, req.user.id]);
    }

    const result = await pool.query('SELECT id, email, full_name, role FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

module.exports = router;
