package com.aftermarket.backend.workflow;

import java.util.List;
import org.flowable.engine.delegate.DelegateExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.aftermarket.backend.domain.Ccr;
import com.aftermarket.backend.repo.CcrRepository;
import com.aftermarket.backend.service.ActivityService;
import com.aftermarket.backend.service.NotificationService;

@Component("domainEvents")
public class AftermarketDomainEvents {

    private static final Logger log = LoggerFactory.getLogger(AftermarketDomainEvents.class);

    private final CcrRepository ccrs;
    private final NotificationService notifications;
    private final ActivityService activity;

    public AftermarketDomainEvents(
            CcrRepository ccrs,
            NotificationService notifications,
            ActivityService activity) {
        this.ccrs = ccrs;
        this.notifications = notifications;
        this.activity = activity;
    }

    public void handle(DelegateExecution execution, String event) {
        String entityType = stringVar(execution, "entityType");
        String businessKey = stringVar(execution, "businessKey");
        if (businessKey == null) {
            businessKey = requireRequestId(execution);
        }
        log.info("Domain event {} for {} {}", event, entityType, businessKey);
        handleCcrEvent(businessKey, event);
        activity.record(
                "EVENT_" + event,
                event,
                "Ccr",
                businessKey,
                stringVar(execution, "submittedBy"),
                "{}");
    }

    public void finalizeCcr(DelegateExecution execution) {
        String businessKey = requireRequestId(execution);
        boolean approved = Boolean.TRUE.equals(execution.getVariable("approved"));
        String submittedBy = stringVar(execution, "submittedBy");
        String managerId = stringVar(execution, "managerId");
        ccrs.findByReference(businessKey).ifPresent(ccr -> {
            ccr.setStatus(approved ? "Approved" : "Rejected");
            ccr.setRecentUpdate(approved ? "CCR Approved" : "CCR Rejected");
            ccr.setWorkflowState("ENDED");
            ccr.setCurrentTaskKey(null);
            ccrs.save(ccr);
        });
        activity.record(
                approved ? "WORKFLOW_APPROVED" : "WORKFLOW_CANCELLED",
                approved ? "CCR approved" : "CCR cancelled",
                "Ccr",
                businessKey,
                stringVar(execution, "lastCompletedBy"),
                "{}");
        notifications.notify(
                "REQUEST_" + (approved ? "APPROVED" : "CANCELLED"),
                "Request " + businessKey + (approved ? " approved" : " cancelled"),
                approved
                        ? "Request " + businessKey + " was approved by finance."
                        : "Request " + businessKey + " was rejected by finance and has been cancelled.",
                "Ccr",
                businessKey,
                recipients(submittedBy, managerId),
                List.of());
    }

    private void handleCcrEvent(String reference, String event) {
        Ccr ccr = ccrs.findByReference(reference).orElse(null);
        if (ccr == null) {
            log.warn("CCR not found for event {}: {}", event, reference);
            return;
        }
        switch (event) {
            case "CCR_SUBMITTED" -> {
                ccr.setStatus("Pending Approval");
                ccr.setRecentUpdate("CCR Submitted");
                ccr.setWorkflowState("RUNNING");
                ccrs.save(ccr);
            }
            case "CCR_MANAGER_APPROVAL_REQUESTED" -> notifications.notify(
                    "APPROVAL_REQUESTED",
                    "Approval needed: " + reference,
                    "CCR " + reference + " is waiting for manager approval.",
                    "Ccr",
                    reference,
                    List.of(),
                    List.of("supervisors"));
            case "CCR_MANAGER_REMINDER" -> notifications.notify(
                    "APPROVAL_REMINDER",
                    "Reminder: " + reference + " is still pending",
                    "CCR " + reference + " has been waiting for manager approval.",
                    "Ccr",
                    reference,
                    List.of(),
                    List.of("supervisors"));
            case "CCR_MANAGER_ESCALATION" -> notifications.notify(
                    "APPROVAL_ESCALATED",
                    "Escalated: " + reference + " breached its SLA",
                    "CCR " + reference + " was escalated because it was not approved in time.",
                    "Ccr",
                    reference,
                    List.of(),
                    List.of("supervisors", "finance"));
            case "CCR_FINANCE_APPROVAL_REQUESTED" -> {
                notifications.notify(
                        "APPROVED_BY_MANAGER",
                        "Request " + reference + " approved by manager",
                        "Request " + reference + " was approved by the manager and is now with finance.",
                        "Ccr",
                        reference,
                        recipients(ccr.getCreatedBy(), null),
                        List.of());
                notifications.notify(
                        "FINANCE_APPROVAL_REQUESTED",
                        "Finance review needed: " + reference,
                        "Request " + reference + " passed manager approval and needs finance review.",
                        "Ccr",
                        reference,
                        List.of(),
                        List.of("finance"));
            }
            case "CCR_FINAL_OUTCOME" -> {
            }
            default -> {
            }
        }
    }

    private List<String> recipients(String creatorId, String managerId) {
        List<String> users = new java.util.ArrayList<>();
        if (creatorId != null && !creatorId.isBlank()) users.add(creatorId);
        if (managerId != null && !managerId.isBlank() && !managerId.equals(creatorId)) users.add(managerId);
        return users;
    }

    private String requireRequestId(DelegateExecution execution) {
        Object requestId = execution.getVariable("requestId");
        if (requestId == null) {
            requestId = execution.getVariable("businessKey");
        }
        if (requestId == null) {
            throw new IllegalStateException("Process variable 'requestId' is required");
        }
        return requestId.toString();
    }

    private String stringVar(DelegateExecution execution, String name) {
        Object value = execution.getVariable(name);
        return value == null ? null : value.toString();
    }

    private String notBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
