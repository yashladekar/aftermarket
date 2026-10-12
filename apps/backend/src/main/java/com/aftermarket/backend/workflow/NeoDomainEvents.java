package com.aftermarket.backend.workflow;

import java.util.List;
import org.flowable.engine.delegate.DelegateExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.aftermarket.backend.config.NeoProperties;
import com.aftermarket.backend.domain.Claim;
import com.aftermarket.backend.domain.MandateRequest;
import com.aftermarket.backend.repo.ApprovalRuleRepository;
import com.aftermarket.backend.repo.ClaimRepository;
import com.aftermarket.backend.repo.MandateRequestRepository;
import com.aftermarket.backend.service.ActivityService;
import com.aftermarket.backend.service.NotificationService;

@Component("domainEvents")
public class NeoDomainEvents {

    private static final Logger log = LoggerFactory.getLogger(NeoDomainEvents.class);

    private final ClaimRepository claims;
    private final MandateRequestRepository mandates;
    private final ApprovalRuleRepository rules;
    private final NotificationService notifications;
    private final ActivityService activity;
    private final NeoProperties properties;

    public NeoDomainEvents(
            ClaimRepository claims,
            MandateRequestRepository mandates,
            ApprovalRuleRepository rules,
            NotificationService notifications,
            ActivityService activity,
            NeoProperties properties) {
        this.claims = claims;
        this.mandates = mandates;
        this.rules = rules;
        this.notifications = notifications;
        this.activity = activity;
        this.properties = properties;
    }

    public void handle(DelegateExecution execution, String event) {
        String entityType = stringVar(execution, "entityType");
        String businessKey = stringVar(execution, "businessKey");
        if (businessKey == null) {
            businessKey = requireRequestId(execution);
        }
        log.info("Domain event {} for {} {}", event, entityType, businessKey);
        if ("MANDATE".equals(entityType)) {
            handleMandateEvent(businessKey, event);
        } else {
            handleClaimEvent(businessKey, event);
        }
        activity.record(
                "EVENT_" + event,
                event,
                "MANDATE".equals(entityType) ? "MandateRequest" : "Claim",
                businessKey,
                stringVar(execution, "submittedBy"),
                "{}");
    }

    public void evaluatePolicy(DelegateExecution execution) {
        String businessKey = requireRequestId(execution);
        double total = toDouble(execution.getVariable("totalAmount"));
        double threshold = rules.findByActiveTrueOrderByApprovalLimitAsc().stream()
                .findFirst()
                .map(rule -> rule.getApprovalLimit())
                .orElse(properties.financeThreshold());
        boolean requiresFinance = total > threshold;
        execution.setVariable("requiresFinance", requiresFinance);
        log.info("Policy decision for {}: total={} requiresFinance={}", businessKey, total, requiresFinance);
    }

    public void finalizeRequest(DelegateExecution execution) {
        String businessKey = requireRequestId(execution);
        boolean approved = Boolean.TRUE.equals(execution.getVariable("approved"));
        String entityType = stringVar(execution, "entityType");
        if ("MANDATE".equals(entityType)) {
            mandates.findByNumber(businessKey).ifPresent(mandate -> {
                mandate.setOverall(approved ? "Approved" : "Rejected");
                mandate.setDoa("Complete");
                mandate.setClearing("Complete");
                mandate.setWorkflowState("ENDED");
                mandate.setCurrentTaskKey(null);
                mandates.save(mandate);
            });
            activity.record(
                    approved ? "WORKFLOW_APPROVED" : "WORKFLOW_REJECTED",
                    approved ? "Mandate approved" : "Mandate rejected",
                    "MandateRequest",
                    businessKey,
                    stringVar(execution, "lastCompletedBy"),
                    "{}");
            notifications.notify(
                    approved ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
                    approved ? "Mandate " + businessKey + " was approved" : "Mandate " + businessKey + " was rejected",
                    approved ? "The mandate request was approved." : "The mandate request was rejected.",
                    "MandateRequest",
                    businessKey,
                    List.of(notBlank(stringVar(execution, "submittedBy"), "")),
                    List.of());
        } else {
            claims.findByLineId(businessKey).ifPresent(claim -> {
                claim.setStatus(approved ? "Completed" : "Rejected");
                claim.setWorkflowState("ENDED");
                claim.setCurrentTaskKey(null);
                claims.save(claim);
            });
            activity.record(
                    approved ? "WORKFLOW_APPROVED" : "WORKFLOW_REJECTED",
                    approved ? "Claim approved" : "Claim rejected",
                    "Claim",
                    businessKey,
                    stringVar(execution, "lastCompletedBy"),
                    "{}");
            notifications.notify(
                    approved ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
                    approved ? businessKey + " was approved" : businessKey + " was rejected",
                    approved ? "Your claim was approved." : "Your claim was rejected.",
                    "Claim",
                    businessKey,
                    List.of(notBlank(stringVar(execution, "submittedBy"), "")),
                    List.of());
        }
    }

    public void finalizeMandate(DelegateExecution execution) {
        finalizeRequest(execution);
    }

    public void confirmBooking(DelegateExecution execution) {
        String businessKey = requireRequestId(execution);
        String reference = "BK-" + businessKey + "-" + System.currentTimeMillis() % 100000;
        execution.setVariable("bookingReference", reference);
        log.info("Booking confirmed for {}: {}", businessKey, reference);
        activity.record("BOOKING_CONFIRMED", reference, "Claim", businessKey, null, "{}");
    }

    private void handleClaimEvent(String lineId, String event) {
        Claim claim = claims.findByLineId(lineId).orElse(null);
        if (claim == null) {
            log.warn("Claim not found for event {}: {}", event, lineId);
            return;
        }
        switch (event) {
            case "SUBMITTED" -> {
                claim.setStatus("Forecast");
                claim.setWorkflowState("RUNNING");
                claims.save(claim);
            }
            case "MANAGER_APPROVAL_REQUESTED" -> notifications.notify(
                    "APPROVAL_REQUESTED",
                    "Approval needed: " + lineId,
                    claim.getDescription() + " (" + claim.getReportingValue() + ") is waiting for your approval.",
                    "Claim",
                    lineId,
                    List.of(),
                    List.of("supervisors"));
            case "MANAGER_REMINDER" -> notifications.notify(
                    "APPROVAL_REMINDER",
                    "Reminder: " + lineId + " is still pending",
                    claim.getDescription() + " has been waiting for your approval.",
                    "Claim",
                    lineId,
                    List.of(),
                    List.of("supervisors"));
            case "MANAGER_ESCALATION" -> notifications.notify(
                    "APPROVAL_ESCALATED",
                    "Escalated: " + lineId + " breached its SLA",
                    claim.getDescription() + " was escalated because it was not approved in time.",
                    "Claim",
                    lineId,
                    List.of(),
                    List.of("supervisors", "finance"));
            case "FINANCE_APPROVAL_REQUESTED" -> notifications.notify(
                    "FINANCE_APPROVAL_REQUESTED",
                    "Finance review needed: " + lineId,
                    claim.getDescription() + " exceeds the auto-approval threshold.",
                    "Claim",
                    lineId,
                    List.of(),
                    List.of("finance"));
            case "FINAL_OUTCOME" -> {
            }
            default -> {
            }
        }
    }

    private void handleMandateEvent(String number, String event) {
        MandateRequest mandate = mandates.findByNumber(number).orElse(null);
        if (mandate == null) {
            log.warn("Mandate not found for event {}: {}", event, number);
            return;
        }
        switch (event) {
            case "MANDATE_SUBMITTED" -> {
                mandate.setOverall("Awaiting DOA Approval Mandate Request");
                mandate.setDoa("Submitted");
                mandate.setWorkflowState("RUNNING");
                mandates.save(mandate);
            }
            case "CLEARING_REVIEW_REQUESTED" -> notifications.notify(
                    "APPROVAL_REQUESTED",
                    "Clearing review needed: " + number,
                    "Mandate " + number + " is waiting for Local Clearing House review.",
                    "MandateRequest",
                    number,
                    List.of(),
                    List.of("supervisors"));
            case "DOA_APPROVAL_REQUESTED" -> {
                mandate.setClearing("Complete");
                mandates.save(mandate);
                notifications.notify(
                        "DOA_APPROVAL_REQUESTED",
                        "DOA approval needed: " + number,
                        "Mandate " + number + " is waiting for DOA approval.",
                        "MandateRequest",
                        number,
                        List.of(),
                        List.of("finance"));
            }
            case "MANDATE_FINAL_OUTCOME" -> {
            }
            default -> {
            }
        }
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

    private double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value).replace(",", ""));
        } catch (Exception e) {
            return 0;
        }
    }
}
