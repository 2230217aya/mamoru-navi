CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS shelters (
    shelter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    capacity INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP
);


-- 【テスト避難所：中央市民体育館】

INSERT INTO shelters (
    shelter_id, name, address, latitude, longitude, capacity
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '中央市民体育館（避難所）',
    '大阪市北区中崎西2丁目3-35',
    34.7056,
    135.5063,
    500
) ON CONFLICT (shelter_id) DO NOTHING;