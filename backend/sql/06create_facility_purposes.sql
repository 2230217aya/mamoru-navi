CREATE TABLE facility_purposes (
    purpose_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_id UUID NOT NULL,
    purpose_name VARCHAR(50) NOT NULL,

    CONSTRAINT fk_purpose_type
        FOREIGN KEY (type_id)
        REFERENCES facility_types(type_id)
);