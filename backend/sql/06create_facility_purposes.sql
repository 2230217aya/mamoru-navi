-- 平常時の公共施設（施設の利用目的)
CREATE TABLE IF NOT EXISTS facility_purposes (
    purpose_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_id UUID NOT NULL,
    purpose_name VARCHAR(50) NOT NULL,

    CONSTRAINT fk_purpose_type
        FOREIGN KEY (type_id)
        REFERENCES facility_types(type_id)
);

INSERT INTO facility_purposes (type_id, purpose_name)
VALUES

-- library
(
    (SELECT type_id FROM facility_types WHERE type_name='library'),
    '会議室'
),
(
    (SELECT type_id FROM facility_types WHERE type_name='library'),
    '自習室'
),
(
    (SELECT type_id FROM facility_types WHERE type_name='library'),
    '閲覧室'
),

-- gym
(
    (SELECT type_id FROM facility_types WHERE type_name='gym'),
    'バスケットボール'
),
(
    (SELECT type_id FROM facility_types WHERE type_name='gym'),
    'バドミントン'
),
(
    (SELECT type_id FROM facility_types WHERE type_name='gym'),
    '卓球'
),

-- city hall
(
    (SELECT type_id FROM facility_types WHERE type_name='city_hall'),
    '証明書の発行'
),
(
    (SELECT type_id FROM facility_types WHERE type_name='city_hall'),
    '住所の変動・印鑑登録'
),
(
    (SELECT type_id FROM facility_types WHERE type_name='city_hall'),
    'マイナンバー'
),
(
    (SELECT type_id FROM facility_types WHERE type_name='city_hall'),
    '戸籍の提出・相談'
)
 