package com.aftermarket.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.aftermarket.backend.domain.Ccr;
import com.aftermarket.backend.repo.CcrRepository;
import com.aftermarket.backend.workflow.WorkflowFacade;
import com.aftermarket.backend.workflow.dto.ProcessInstanceResponse;

@Service
public class ReconciliationService {

    private static final Logger log = LoggerFactory.getLogger(ReconciliationService.class);

    private final CcrRepository ccrs;
    private final WorkflowFacade workflow;
    private final CcrService ccrService;
    private final ActivityService activity;

    public ReconciliationService(
            CcrRepository ccrs,
            WorkflowFacade workflow,
            CcrService ccrService,
            ActivityService activity) {
        this.ccrs = ccrs;
        this.workflow = workflow;
        this.ccrService = ccrService;
        this.activity = activity;
    }

    @Scheduled(fixedDelayString = "${aftermarket.reconciliation-interval-ms:15000}")
    public void reconcile() {
        for (Ccr ccr : ccrs.findByWorkflowInstanceIdIsNotNull()) {
            if ("ENDED".equals(ccr.getWorkflowState())) {
                continue;
            }
            try {
                ProcessInstanceResponse instance = workflow.getInstance(ccr.getWorkflowInstanceId());
                String before = ccr.getCurrentTaskKey();
                ccrService.applyInstance(ccr, instance);
                ccrs.save(ccr);
                if (before == null ? ccr.getCurrentTaskKey() != null
                        : !before.equals(ccr.getCurrentTaskKey())) {
                    activity.record("RECONCILED", ccr.getReference(), "Ccr", ccr.getReference(), null, "{}");
                }
            } catch (RuntimeException e) {
                log.warn("Reconciliation failed for CCR {}: {}", ccr.getReference(), e.getMessage());
            }
        }
    }
}
