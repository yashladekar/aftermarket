package com.aftermarket.backend.workflow.dto;

import java.time.Instant;
import java.util.List;

/** An approval awaiting action, either in the user's queue or on a request they raised. */
public record PendingApprovalView(
        String taskId,
        String taskName,
        String taskKey,
        String requestId,
        String requestType,
        String description,
        String vendorName,
        String value,
        String raisedById,
        String raisedByName,
        Instant createdOn,
        boolean canAct,
        List<String> candidateGroups) {
}
