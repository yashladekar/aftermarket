package com.aftermarket.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "mci_activity_log")
public class ActivityLog extends BaseEntity {

    @Column(name = "action")
    private String action = "";

    @Column(name = "description", length = 2000)
    private String description = "";

    @Column(name = "entity_type")
    private String entityType = "";

    @Column(name = "entity_id")
    private String entityId = "";

    @Column(name = "actor_id")
    private String actorId = "";

    @Column(name = "data", length = 4000)
    private String data = "{}";

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getActorId() {
        return actorId;
    }

    public void setActorId(String actorId) {
        this.actorId = actorId;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }
}
