package com.aftermarket.backend.workflow;

import org.flowable.engine.delegate.DelegateExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.aftermarket.backend.repo.MandateRequestRepository;
import com.aftermarket.backend.service.ActivityService;

/**
 * Flowable service-task delegate for the ccrApproval process.
 * Registered as Spring bean "ccrDomainEvents" so BPMN expressions
 * like #{ccrDomainEvents.onSubmitted(execution)} resolve correctly.
 */
@Component("ccrDomainEvents")
public class CcrDomainEvents {

    private static final Logger log = LoggerFactory.getLogger(CcrDomainEvents.class);

    private final MandateRequestRepository mandates;
    private final ActivityService activity;

    public CcrDomainEvents(MandateRequestRepository mandates, ActivityService activity) {
        this.mandates = mandates;
        this.activity = activity;
    }

    /** Called immediately after process start. Sets status to PENDING_AFTERMARKET. */
    public void onSubmitted(DelegateExecution execution) {
        String requestId = requireRequestId(execution);
        log.info("CCR submitted: {}", requestId);
        mandates.findByNumber(requestId).ifPresent(mandate -> {
            mandate.setOverall("Pending Aftermarket Approval");
            mandate.setClearing("Pending");
            mandate.setDoa("Pending");
            mandate.setWorkflowState("RUNNING");
            mandate.setCurrentTaskKey("aftermarketApproval");
            mandates.save(mandate);
        });
        activity.record(
                "CCR_SUBMITTED",
                "CCR submitted – awaiting Aftermarket approval",
                "MandateRequest",
                requestId,
                stringVar(execution, "submittedBy"),
                "{}");
    }

    /** Called when Finance approves (process reaches finalizeApproved task). */
    public void onApproved(DelegateExecution execution) {
        String requestId = requireRequestId(execution);
        log.info("CCR fully approved: {}", requestId);
        mandates.findByNumber(requestId).ifPresent(mandate -> {
            mandate.setOverall("Approved");
            mandate.setClearing("Complete");
            mandate.setDoa("Complete");
            mandate.setWorkflowState("ENDED");
            mandate.setCurrentTaskKey(null);
            mandates.save(mandate);
        });
        activity.record(
                "CCR_APPROVED",
                "CCR approved by Finance",
                "MandateRequest",
                requestId,
                stringVar(execution, "decidedBy"),
                "{}");
    }

    /** Called when Aftermarket OR Finance rejects (process reaches finalizeRejected task). */
    public void onRejected(DelegateExecution execution) {
        String requestId = requireRequestId(execution);
        log.info("CCR rejected: {}", requestId);
        mandates.findByNumber(requestId).ifPresent(mandate -> {
            mandate.setOverall("Rejected");
            mandate.setWorkflowState("ENDED");
            mandate.setCurrentTaskKey(null);
            mandates.save(mandate);
        });
        activity.record(
                "CCR_REJECTED",
                "CCR rejected",
                "MandateRequest",
                requestId,
                stringVar(execution, "decidedBy"),
                "{}");
    }

    private String requireRequestId(DelegateExecution execution) {
        Object val = execution.getVariable("requestId");
        if (val == null) {
            val = execution.getVariable("businessKey");
        }
        if (val == null) {
            throw new IllegalStateException("Process variable 'requestId' is required in ccrApproval");
        }
        return val.toString();
    }

    private String stringVar(DelegateExecution execution, String name) {
        Object val = execution.getVariable(name);
        return val == null ? null : val.toString();
    }
}

