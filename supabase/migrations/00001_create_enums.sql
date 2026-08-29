-- 00001_create_enums.sql
-- Enum definitions for REHABTRACK

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- User Roles
CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'PROJECT_MANAGER',
    'FIELD_OFFICER',
    'VIEWER',
    'ADOPTER'
);

-- Project Status
CREATE TYPE project_status AS ENUM (
    'PLANNING',
    'ACTIVE',
    'COMPLETED',
    'SUSPENDED'
);

-- Project Visibility
CREATE TYPE project_visibility AS ENUM (
    'PUBLIC',
    'PRIVATE'
);

-- Rehabilitation Types
CREATE TYPE rehabilitation_type AS ENUM (
    'REFORESTATION',
    'AGROFORESTRY',
    'MANGROVE_RESTORATION',
    'RIPARIAN_RESTORATION',
    'MINE_RECLAMATION',
    'WATERSHED_REHABILITATION',
    'OTHER'
);

-- Plot Monitoring Status
CREATE TYPE monitoring_status AS ENUM (
    'RECOVERING',   -- Green
    'MONITORING',   -- Yellow
    'AT_RISK'       -- Red
);

-- Plant Conditions
CREATE TYPE plant_condition AS ENUM (
    'HEALTHY',
    'STRESSED',
    'DEAD',
    'MISSING',
    'UNKNOWN'
);

-- Species Category
CREATE TYPE species_category AS ENUM (
    'TREE',
    'SHRUB',
    'GRASS',
    'MANGROVE',
    'OTHER'
);

-- Intervention Type
CREATE TYPE intervention_type AS ENUM (
    'PLANTING',
    'REPLANTING',
    'MAINTENANCE',
    'FERTILIZATION',
    'WATERING',
    'PEST_CONTROL',
    'OTHER'
);

-- Sync Status
CREATE TYPE sync_status AS ENUM (
    'PENDING',
    'SYNCED',
    'FAILED'
);

-- Satellite Observation Quality Flag
CREATE TYPE quality_flag AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW'
);

-- Adoption Status
CREATE TYPE adoption_status AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'CANCELLED'
);

-- Project Update Type
CREATE TYPE update_type AS ENUM (
    'PROJECT_STORY',
    'FOREST_JOURNAL',
    'MONITORING_UPDATE',
    'IMPACT_REPORT',
    'GENERAL'
);

-- Project Member Role
CREATE TYPE project_member_role AS ENUM (
    'MANAGER',
    'FIELD_OFFICER',
    'VIEWER'
);
