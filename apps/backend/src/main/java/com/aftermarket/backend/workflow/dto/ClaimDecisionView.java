package com.aftermarket.backend.workflow.dto;

import java.time.Instant;

/** An approval decision recorded against a claim's workflow. */
public record ClaimDecisionView(
        String taskId,
        String taskKey,
        String taskName,
        String decision,
        String comment,
        String actorId,
        String actorName,
        Instant decidedOn) {
}
