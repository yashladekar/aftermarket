package com.aftermarket.backend.workflow.dto;

import java.time.Instant;

/** An approval decision relevant to the current user (they took it, or it was taken on their request). */
public record ApprovalDecisionItem(
        String taskId,
        String requestId,
        String requestType,
        String taskName,
        String decision,
        String comment,
        String actorId,
        String actorName,
        Instant decidedOn) {
}
