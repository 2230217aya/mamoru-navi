-- usersテーブルの作成
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    birthday DATE NOT NULL,
    blood_type VARCHAR(5),
    medical_conditions TEXT,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL, -- ※元の設計はVARCHAR(20)でしたが、安全のため255に変更しています
    address TEXT NOT NULL,
    home_location GEOMETRY NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 固定テストユーザー「テストユーザー太郎」のデータ挿入
-- 既に存在する場合は無視する（エラーにならないようにする）ためのON CONFLICT
INSERT INTO users (
    user_id, name, gender, birthday, blood_type, medical_conditions, 
    phone_number, email, address, home_location, user_role
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000', 
    'テストユーザー太郎', 
    '男性', 
    '1990-01-01', 
    'A', 
    '特になし', 
    '090-1234-5678', 
    'test@example.com', 
    '東京都渋谷区〇〇', 
    ST_SetSRID(ST_MakePoint(139.700571, 35.658099), 4326), -- 渋谷駅の座標
    'user'
)
ON CONFLICT (user_id) DO NOTHING;
