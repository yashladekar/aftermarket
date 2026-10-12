package com.aftermarket.backend.workflow.dto;

import java.time.Instant;

/** A workflow task of a claim, including its decision once completed. */
public record ClaimTaskView(
        String taskId,
        String name,
        String taskKey,
        String status,
        String assigneeId,
        String assigneeName,
        String decision,
        Instant createdOn,
        Instant completedOn) {
}
