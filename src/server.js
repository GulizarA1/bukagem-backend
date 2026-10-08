require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const eylemlerRoutes = require('./routes/eylemler');
const notesRoutes = require('./routes/notes');
const kaynaklarRoutes = require('./routes/kaynaklar');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/eylemler', eylemlerRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/kaynaklar', kaynaklarRoutes);

app.use((req, res) => res.status(404).json({ error: 'Bulunamadı.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Sunucu hatası.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BUKAGEM API ${PORT} portunda çalışıyor.`);
});
