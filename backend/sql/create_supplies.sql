CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- テーブルの作成
CREATE TABLE IF NOT EXISTS supplies (
    supply_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),       -- 物資のuuid
    shelter_id UUID NOT NULL REFERENCES shelters(shelter_id),   -- どの避難所の物資か
    genre VARCHAR(50) NOT NULL,             -- 品目 
    name VARCHAR(100) NOT NULL,             -- 物資名
    quantity INTEGER NOT NULL DEFAULT 0,    -- 数量
    unit VARCHAR(20) NOT NULL,              -- 単位
    expiration DATE,                        -- 有効期限（期限が無い物資もあるのでNULL可）
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,    -- 登録日時
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP              -- 更新日時
);