package com.aftermarket.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.aftermarket.backend.domain.Claim;
import com.aftermarket.backend.domain.MandateRequest;
import com.aftermarket.backend.repo.ClaimRepository;
import com.aftermarket.backend.repo.MandateRequestRepository;
import com.aftermarket.backend.workflow.WorkflowFacade;
import com.aftermarket.backend.workflow.dto.ProcessInstanceResponse;

@Service
public class ReconciliationService {

    private static final Logger log = LoggerFactory.getLogger(ReconciliationService.class);

    private final ClaimRepository claims;
    private final MandateRequestRepository mandates;
    private final WorkflowFacade workflow;
    private final ClaimService claimService;
    private final MandateService mandateService;
    private final ActivityService activity;

    public ReconciliationService(
            ClaimRepository claims,
            MandateRequestRepository mandates,
            WorkflowFacade workflow,
            ClaimService claimService,
            MandateService mandateService,
            ActivityService activity) {
        this.claims = claims;
        this.mandates = mandates;
        this.workflow = workflow;
        this.claimService = claimService;
        this.mandateService = mandateService;
        this.activity = activity;
    }

    @Scheduled(fixedDelayString = "${aftermarket.reconciliation-interval-ms:15000}")
    public void reconcile() {
        for (Claim claim : claims.findByWorkflowInstanceIdIsNotNull()) {
            if ("ENDED".equals(claim.getWorkflowState())) {
                continue;
            }
            try {
                ProcessInstanceResponse instance = workflow.getInstance(claim.getWorkflowInstanceId());
                String before = claim.getCurrentTaskKey();
                claimService.applyInstance(claim, instance);
                claims.save(claim);
                if (before == null ? claim.getCurrentTaskKey() != null
                        : !before.equals(claim.getCurrentTaskKey())) {
                    activity.record("RECONCILED", claim.getLineId(), "Claim", claim.getLineId(), null, "{}");
                }
            } catch (RuntimeException e) {
                log.warn("Reconciliation failed for claim {}: {}", claim.getLineId(), e.getMessage());
            }
        }
        for (MandateRequest mandate : mandates.findByWorkflowInstanceIdIsNotNull()) {
            if ("ENDED".equals(mandate.getWorkflowState())) {
                continue;
            }
            try {
                ProcessInstanceResponse instance = workflow.getInstance(mandate.getWorkflowInstanceId());
                mandateService.applyInstance(mandate, instance);
                mandates.save(mandate);
            } catch (RuntimeException e) {
                log.warn("Reconciliation failed for mandate {}: {}", mandate.getNumber(), e.getMessage());
            }
        }
    }
}
