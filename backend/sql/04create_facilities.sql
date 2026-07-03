CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS facility_types (
    type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS facilities (
    facility_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type_id UUID NOT NULL REFERENCES facility_types(type_id) ON DELETE CASCADE,
    business_hours VARCHAR(100),
    closed_days VARCHAR(100),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facility_purpose (
    purpose_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_id UUID NOT NULL REFERENCES facility_types(type_id) ON DELETE CASCADE,
    purpose_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS facility_reservations (
    reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(facility_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    purpose_id UUID REFERENCES facility_purpose(purpose_id) ON DELETE SET NULL,
    issued_number   SMALLINT NOT NULL,
    start_time      TIMESTAMP,
    end_time        TIMESTAMP,
    status          VARCHAR(20) NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- サンプルデータ INSERT (各テーブル最大5件 / 大阪市内限定)
-- ============================================================

-- ------------------------------------------------------------
-- facility_types
-- ------------------------------------------------------------
INSERT INTO facility_types (type_id, type_name) VALUES
('a1000000-0000-0000-0000-000000000001', 'library'),
('a1000000-0000-0000-0000-000000000002', 'gym'),
('a1000000-0000-0000-0000-000000000003', 'city_hall'),
('a1000000-0000-0000-0000-000000000004', 'community_center'),
('a1000000-0000-0000-0000-000000000005', 'park');
 
-- ------------------------------------------------------------
-- facilities (すべて大阪市内)
-- ------------------------------------------------------------
INSERT INTO facilities (facility_id, name, type_id, business_hours, closed_days, latitude, longitude) VALUES
('b2000000-0000-0000-0000-000000000001', '大阪市立中央図書館', 'a1000000-0000-0000-0000-000000000001', '09:00-20:00', '月曜日・祝日', 34.68030, 135.51650),
('b2000000-0000-0000-0000-000000000002', '大阪市立中央体育館', 'a1000000-0000-0000-0000-000000000002', '09:00-21:00', '第2・第4月曜日', 34.66680, 135.52280),
('b2000000-0000-0000-0000-000000000003', '大阪市役所', 'a1000000-0000-0000-0000-000000000003', '08:45-17:30', '土曜日・日曜日・祝日', 34.68730, 135.50440),
('b2000000-0000-0000-0000-000000000004', '阿倍野市民センター', 'a1000000-0000-0000-0000-000000000004', '09:00-22:00', '年末年始', 34.64550, 135.51330),
('b2000000-0000-0000-0000-000000000005', '大阪城公園スポーツ広場', 'a1000000-0000-0000-0000-000000000005', '24時間', 'なし', 34.68730, 135.52590);
 
-- ------------------------------------------------------------
-- facility_purposes
-- ------------------------------------------------------------
INSERT INTO facility_purpose (purpose_id, type_id, purpose_name) VALUES
('c3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '読書・学習'),
('c3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'バスケットボール'),
('c3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'バレーボール'),
('c3000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', '住民票発行'),
('c3000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', '証明書の発行'),
('c3000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', '住所の変更・印鑑登録'),
('c3000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003', 'マイナンバー'),
('c3000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000003', '戸籍の提出・相談'),
('c3000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000004', '会議室利用');
 
-- ------------------------------------------------------------
-- facility_reservations
-- ------------------------------------------------------------
INSERT INTO facility_reservations (reservation_id, facility_id, user_id, purpose_id, issued_number, start_time, end_time, status) VALUES
('d4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'c3000000-0000-0000-0000-000000000001', 1, '2024-05-20 13:00:00', '2024-05-20 15:00:00', 'confirmed'),
('d4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'c3000000-0000-0000-0000-000000000002', 2, '2024-05-21 10:00:00', '2024-05-21 12:00:00', 'waiting'),
('d4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'c3000000-0000-0000-0000-000000000003', 3, '2024-05-22 14:00:00', '2024-05-22 16:00:00', 'confirmed'),
('d4000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', 'c3000000-0000-0000-0000-000000000004', 4, '2024-05-23 09:30:00', '2024-05-23 10:00:00', 'completed'),
('d4000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555555', 'c3000000-0000-0000-0000-000000000005', 5, '2024-05-24 18:00:00', '2024-05-24 20:00:00', 'waiting');
