-- Tabel 1: Paket_Langganan
CREATE TABLE Paket_Langganan (
  tier_id TEXT PRIMARY KEY,
  nama_tier TEXT NOT NULL, -- Contoh: Weekend/Daily/Curator
  harga_bulanan FLOAT NOT NULL,
  fitur_benefit TEXT
);

-- Tabel 2: User
CREATE TABLE "User" ( -- Gunakan quote karena User adalah reserved keyword
  user_id TEXT PRIMARY KEY,
  nama_lengkap TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  alamat_pengiriman TEXT
);

-- Tabel 3: Status_Langganan
CREATE TABLE Status_Langganan (
  sub_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "User"(user_id),
  tier_id TEXT REFERENCES Paket_Langganan(tier_id),
  status_aktif TEXT, -- Active/Paused
  tanggal_mulai DATE,
  next_billing_date DATE
);

-- Tabel 4: Profil_Rasa_User
CREATE TABLE Profil_Rasa_User (
  profile_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "User"(user_id),
  pref_acidity INT, -- Skala 1-5
  pref_body INT, -- Skala 1-5
  pref_roast TEXT, -- Light/Medium/Dark
  catatan_preferensi TEXT
);

-- Tabel 5: Stok_Kopi
CREATE TABLE Stok_Kopi (
  coffee_id TEXT PRIMARY KEY,
  nama_origin TEXT, -- Contoh: Gayo/Batusangkar
  jumlah_stok_kg FLOAT,
  tanggal_roasting DATE
);

-- Tabel 6: Metadata_Rasa_Kopi
CREATE TABLE Metadata_Rasa_Kopi (
  meta_id TEXT PRIMARY KEY,
  coffee_id TEXT REFERENCES Stok_Kopi(coffee_id),
  level_acidity INT, -- Skala 1-5
  level_body INT, -- Skala 1-5
  tasting_notes TEXT -- Contoh: Fruity, Spicy
);

-- Tabel 7: Log_Pengiriman
CREATE TABLE Log_Pengiriman (
  delivery_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "User"(user_id),
  coffee_id TEXT REFERENCES Stok_Kopi(coffee_id),
  tanggal_kirim DATE,
  nomor_resi TEXT
);

-- Tabel 8: Ulasan_Feedback
CREATE TABLE Ulasan_Feedback (
  feedback_id TEXT PRIMARY KEY,
  delivery_id TEXT REFERENCES Log_Pengiriman(delivery_id),
  skor_rating INT, -- Skala 1-5
  review_text TEXT
);
