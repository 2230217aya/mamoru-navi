-- 平常時の公共施設（施設の予約)
--backend\sql\07create_facility_reservations.sql
CREATE TABLE IF NOT EXISTS facility_reservations (
    reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    facility_id UUID NOT NULL,
    user_id UUID NOT NULL,
    purpose_id UUID NOT NULL,

    issued_number SMALLINT,

    start_time TIMESTAMP,
    end_time TIMESTAMP,

    status VARCHAR(20) NOT NULL DEFAULT 'waiting',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reservation_facility
        FOREIGN KEY (facility_id)
        REFERENCES facilities(facility_id),

    CONSTRAINT fk_reservation_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_reservation_purpose
        FOREIGN KEY (purpose_id)
        REFERENCES facility_purposes(purpose_id)
);