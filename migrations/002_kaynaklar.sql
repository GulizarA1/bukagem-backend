-- Kaynaklar sayfası: referans doküman/link listesi
CREATE TABLE IF NOT EXISTS kaynaklar (
  id          SERIAL PRIMARY KEY,
  baslik      VARCHAR(255) NOT NULL,
  url         VARCHAR(500) DEFAULT '#',
  kategori    VARCHAR(100) DEFAULT 'Genel',
  aciklama    TEXT         DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
