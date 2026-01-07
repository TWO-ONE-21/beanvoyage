-- Clean existing data (Optional, handle with care in prod)
TRUNCATE TABLE metadata_rasa_kopi, stok_kopi CASCADE;

-- Insert 3 Coffee Types
-- 1. Light Roast (Fruity/Acidity)
INSERT INTO stok_kopi (coffee_id, nama_origin, jumlah_stok_kg, tanggal_roasting)
VALUES ('coffee-001', 'Gayo Vintage', 50.0, NOW());

INSERT INTO metadata_rasa_kopi (meta_id, coffee_id, level_acidity, level_body, tasting_notes)
VALUES ('meta-001', 'coffee-001', 4, 2, 'Tropical Fruit, Floral, Bright Acidity');

-- 2. Medium Roast (Balanced)
INSERT INTO stok_kopi (coffee_id, nama_origin, jumlah_stok_kg, tanggal_roasting)
VALUES ('coffee-002', 'Bali Kintamani', 35.0, NOW());

INSERT INTO metadata_rasa_kopi (meta_id, coffee_id, level_acidity, level_body, tasting_notes)
VALUES ('meta-002', 'coffee-002', 3, 3, 'Citrus, Brown Sugar, Balanced Body');

-- 3. Dark Roast (Bold/Body)
INSERT INTO stok_kopi (coffee_id, nama_origin, jumlah_stok_kg, tanggal_roasting)
VALUES ('coffee-003', 'Toraja Kalosi', 60.0, NOW());

INSERT INTO metadata_rasa_kopi (meta_id, coffee_id, level_acidity, level_body, tasting_notes)
VALUES ('meta-003', 'coffee-003', 1, 5, 'Dark Chocolate, Spicy, Syrupy Body');

-- Insert Subscription Tier
INSERT INTO paket_langganan (tier_id, nama_tier, harga_bulanan, fitur_benefit)
VALUES 
('TIER-1', 'The Weekend Voyager', 189000, '2x 200g Coffee, Monthly Guide, Free Shipping'),
('TIER-2', 'The Daily Ritual', 289000, '4x 200g Coffee, Monthly Guide, Free Shipping, Priority Support'),
('TIER-3', 'The Curator''s Circle', 450000, 'Weekly Micro-lot, Includes Exclusive KAWA DAUN Heritage Pack, Direct Access to Roaster');

