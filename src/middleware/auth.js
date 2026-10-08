const jwt = require('jsonwebtoken');

// İstek başlığındaki "Authorization: Bearer <token>" değerini doğrular
// ve geçerliyse req.user'a { id, email, role, full_name } koyar.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Oturum açmanız gerekiyor.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Oturum geçersiz veya süresi dolmuş.' });
  }
}

// requireAuth'tan sonra kullanılır; sadece admin rolüne izin verir.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gerekiyor.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
