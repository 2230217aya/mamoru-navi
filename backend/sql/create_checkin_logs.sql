CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS checkin_logs (
    checkin_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    shelter_id UUID NOT NULL REFERENCES shelters(shelter_id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    qr_code_id UUID REFERENCES qr_codes(qr_code_id),
    canceled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);