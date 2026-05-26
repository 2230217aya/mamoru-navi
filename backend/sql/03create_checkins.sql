CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE IF NOT EXISTS checkins (
    checkin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    shelter_id UUID NOT NULL REFERENCES shelters(shelter_id) ON DELETE CASCADE,
    checkin_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checkout_time TIMESTAMP,
    method VARCHAR(20) NOT NULL,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    remarks TEXT
);