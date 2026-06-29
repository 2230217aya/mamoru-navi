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