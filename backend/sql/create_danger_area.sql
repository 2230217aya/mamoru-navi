CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS danger_areas (
    area_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_type VARCHAR(50) NOT NULL,
    risk_level INTEGER NOT NULL,
    intensity VARCHAR(100),
    geom GEOMETRY NOT NULL,
    source VARCHAR(100) NOT NULL,
    description TEXT,
    trigger_condition TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);