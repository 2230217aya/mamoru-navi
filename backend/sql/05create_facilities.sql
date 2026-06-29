-- 平常時の公共施設データ

CREATE TABLE facilities (
    facility_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type_id UUID NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    business_hours VARCHAR(100),
    closed_days VARCHAR(100),

    CONSTRAINT fk_facility_type
        FOREIGN KEY (type_id)
        REFERENCES facility_types(type_id)
);
INSERT INTO facilities
(name, type_id, latitude, longitude, business_hours, closed_days)
VALUES

-- 圖書館
(
'大阪市立中央図書館',
(SELECT type_id FROM facility_types WHERE type_name='library'),
34.6687,
135.4848,
'09:15-20:30',
'月曜日'
),

(
'大阪市立北図書館',
(SELECT type_id FROM facility_types WHERE type_name='library'),
34.7058,
135.4982,
'10:00-19:00',
'月曜日'
),

(
'大阪市立天王寺図書館',
(SELECT type_id FROM facility_types WHERE type_name='library'),
34.6537,
135.5192,
'10:00-19:00',
'月曜日'
),

-- 體育館
(
'Asueアリーナ大阪',
(SELECT type_id FROM facility_types WHERE type_name='gym'),
34.6579,
135.4424,
'09:00-21:00',
'火曜日'
),

(
'大阪市中央体育館',
(SELECT type_id FROM facility_types WHERE type_name='gym'),
34.6578,
135.4422,
'09:00-21:00',
'火曜日'
),

(
'浪速スポーツセンター',
(SELECT type_id FROM facility_types WHERE type_name='gym'),
34.6608,
135.4962,
'09:00-21:00',
'月曜日'
),

-- 市役所
(
'大阪市役所',
(SELECT type_id FROM facility_types WHERE type_name='city_hall'),
34.6938,
135.5022,
'09:00-17:30',
'土・日・祝日'
),

(
'北区役所',
(SELECT type_id FROM facility_types WHERE type_name='city_hall'),
34.7053,
135.5100,
'09:00-17:30',
'土・日・祝日'
);