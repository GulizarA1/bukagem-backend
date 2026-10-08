-- BUKAGEM Eylem Planı Takip Sistemi - İlk şema
-- Bu dosyayı "npm run migrate" ile veya doğrudan psql ile çalıştırabilirsiniz.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'user')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS eylemler (
  no                 SERIAL PRIMARY KEY,
  eksen              VARCHAR(255) NOT NULL,
  faaliyet           TEXT         NOT NULL,
  sorumlu            VARCHAR(255) DEFAULT '',
  destek             VARCHAR(255) DEFAULT '',
  oncelik            VARCHAR(20)  DEFAULT 'Orta' CHECK (oncelik IN ('Kritik', 'Yüksek', 'Orta')),
  baslangic          DATE,
  bitis              DATE,
  durum              VARCHAR(50)  DEFAULT 'Planlandı',
  tamamlanma         INT          DEFAULT 0 CHECK (tamamlanma BETWEEN 0 AND 100),
  kpi                TEXT         DEFAULT '',
  hedef              TEXT         DEFAULT '',
  gecikme_nedeni     TEXT         DEFAULT '',
  butce_sinifi       VARCHAR(20)  DEFAULT '',
  butce_kaynagi      VARCHAR(255) DEFAULT '',
  planlanan_butce    NUMERIC(14,2) DEFAULT 0,
  gerceklesen_butce  NUMERIC(14,2) DEFAULT 0,
  butce_gerceklesme  INT          DEFAULT 0,
  sapma              INT          DEFAULT 0,
  yayin_ciktisi      TEXT         DEFAULT '',
  proje_ciktisi      TEXT         DEFAULT '',
  puko_kaniti        TEXT         DEFAULT '',
  frekans            VARCHAR(50)  DEFAULT '',
  kaynak             VARCHAR(500) DEFAULT '#',
  deleted_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  content    TEXT         DEFAULT '',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eylemler_eksen ON eylemler(eksen);
CREATE INDEX IF NOT EXISTS idx_eylemler_durum ON eylemler(durum);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);

-- updated_at otomatik güncellensin
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_eylemler_updated ON eylemler;
CREATE TRIGGER trg_eylemler_updated BEFORE UPDATE ON eylemler
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_notes_updated ON notes;
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
