-- 平常時の公共施設の種類 (library, gym, city_hall など)

CREATE TABLE facility_types (
    type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_name VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO facility_types (type_name)
VALUES
('library'),
('gym'),
('city_hall');