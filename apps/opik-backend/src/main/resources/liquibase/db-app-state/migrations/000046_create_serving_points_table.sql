-- liquibase formatted sql

-- changeset opik:create_serving_points_table context:default
CREATE TABLE IF NOT EXISTS serving_points (
    id CHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    type VARCHAR(255),
    target_as VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    last_updated_by VARCHAR(255) NOT NULL
);

CREATE INDEX idx_serving_points_workspace_id ON serving_points(workspace_id);
CREATE UNIQUE INDEX idx_serving_points_workspace_name ON serving_points(workspace_id, name);
