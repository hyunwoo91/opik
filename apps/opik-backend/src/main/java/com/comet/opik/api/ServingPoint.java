package com.comet.opik.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Builder;
import lombok.Value;

import java.beans.ConstructorProperties;
import java.time.Instant;
import java.util.UUID;

@Value
@Builder(toBuilder = true)
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class ServingPoint {
    UUID id;
    String name;
    String url;
    String type;
    String targetAs;
    Instant createdAt;
    Instant lastUpdatedAt;
    String createdBy;
    String lastUpdatedBy;

    @ConstructorProperties({"id", "name", "url", "type", "target_as", "created_at", "last_updated_at", "created_by", "last_updated_by"})
    public ServingPoint(UUID id, String name, String url, String type, String targetAs, Instant createdAt, Instant lastUpdatedAt, String createdBy, String lastUpdatedBy) {
        this.id = id;
        this.name = name;
        this.url = url;
        this.type = type;
        this.targetAs = targetAs;
        this.createdAt = createdAt;
        this.lastUpdatedAt = lastUpdatedAt;
        this.createdBy = createdBy;
        this.lastUpdatedBy = lastUpdatedBy;
    }
}
