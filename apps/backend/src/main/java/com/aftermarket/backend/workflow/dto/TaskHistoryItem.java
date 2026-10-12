package com.aftermarket.backend.workflow.dto;

import java.time.Instant;

/** A task instance from the engine's history (open or completed). */
public record TaskHistoryItem(
        String taskId,
        String name,
        String taskDefinitionKey,
        String assignee,
        Instant createdOn,
        Instant completedOn,
        String status) {
}
