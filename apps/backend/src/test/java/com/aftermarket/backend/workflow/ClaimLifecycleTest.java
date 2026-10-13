package com.aftermarket.backend.workflow;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

/**
 * Legacy tests for claimLifecycle and mandateApproval BPMN processes.
 * These processes have been removed. All active workflow tests are in {@link CcrApprovalTest}.
 */
@Disabled("Legacy BPMN processes (claimLifecycle, mandateApproval) have been removed")
class ClaimLifecycleTest {

    @Test
    void lowValueClaimCompletesWithoutFinance() {
        // Disabled — claimLifecycle BPMN removed
    }

    @Test
    void highValueClaimRoutesToFinanceThenRejects() {
        // Disabled — claimLifecycle BPMN removed
    }

    @Test
    void mandateApprovalCompletesThroughBothForums() {
        // Disabled — mandateApproval BPMN removed
    }
}
