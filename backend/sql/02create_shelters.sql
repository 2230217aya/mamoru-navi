CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS shelters (
    shelter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    capacity INTEGER,                -- 最大収容人数
    toilet_count INTEGER DEFAULT 0,  -- ★追加：トイレの数
    supplies TEXT[] DEFAULT '{}',    -- ★追加：備蓄物資リスト（文字列の配列）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP
);

-- 【テスト避難所：中央市民体育館（詳細データあり）】
INSERT INTO shelters (
    shelter_id, name, address, latitude, longitude, capacity, toilet_count, supplies
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '中央市民体育館',
    '大阪市北区中崎西2丁目3-35',
    34.7056,
    135.5063,
    500,
    12,                            -- トイレ12箇所
    '{"食料", "毛布", "簡易ベッド", "水"}' -- 物資リスト
) ,
(
    '22222222-2222-2222-2222-222222222222', 
    '市立扇町小学校', 
    '大阪市北区扇町2丁目9-33', 
    34.7042, 
    135.5090, 
    800,
    20,                            -- トイレ20箇所
    '{"食料", "毛布", "簡易ベッド", "水", "医療キット"}' -- 物資リスト
),
(
    '33333333-3333-3333-3333-333333333333',
    '市立北野小学校', 
    '大阪市北区茶屋町1-14', 
    34.7068, 
    135.4998, 
    600,
    15,
    '{"食料", "毛布", "簡易ベッド", "水"}'
)
ON CONFLICT (shelter_id) DO UPDATE SET 
    capacity = EXCLUDED.capacity,
    toilet_count = EXCLUDED.toilet_count,
    supplies = EXCLUDED.supplies;