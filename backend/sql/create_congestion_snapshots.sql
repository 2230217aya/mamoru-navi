CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS congestion_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shelter_id UUID NOT NULL REFERENCES shelters(shelter_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    current_count INTEGER NOT NULL DEFAULT 0,
    max_capacity INTEGER NOT NULL,
    data_source VARCHAR(20) NOT NULL,
    captured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);