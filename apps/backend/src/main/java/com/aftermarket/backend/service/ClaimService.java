package com.aftermarket.backend.service;

import com.aftermarket.backend.config.AftermarketProperties;
import com.aftermarket.backend.domain.Claim;
import com.aftermarket.backend.repo.ClaimRepository;
import com.aftermarket.backend.workflow.WorkflowFacade;
import com.aftermarket.backend.workflow.dto.ProcessInstanceResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ClaimService {

    private final ClaimRepository claims;
    private final WorkflowFacade workflow;
    private final ActivityService activity;
    private final AftermarketProperties properties;
    private final ObjectMapper mapper;

    public ClaimService(
            ClaimRepository claims,
            WorkflowFacade workflow,
            ActivityService activity,
            AftermarketProperties properties,
            ObjectMapper mapper) {
        this.claims = claims;
        this.workflow = workflow;
        this.activity = activity;
        this.properties = properties;
        this.mapper = mapper;
    }

    public List<Claim> list(Map<String, String> filters) {
        return claims.findAllByOrderByCreatedOnDesc().stream()
                .filter(c -> matches(c, filters))
                .toList();
    }

    public Claim get(String lineId) {
        return claims.findByLineId(lineId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found: " + lineId));
    }

    @Transactional
    public Claim create(String userId, Map<String, Object> payload) {
        Claim claim = new Claim();
        claim.setLineId(nextLineId());
        claim.setStatus("Draft");
        claim.setCreatedBy(userId);
        applyPayload(claim, payload);
        Claim saved = claims.save(claim);
        activity.record("CLAIM_CREATED", saved.getLineId(), "Claim", saved.getLineId(), userId, "{}");
        return saved;
    }

    @Transactional
    public Claim update(String userId, String lineId, Map<String, Object> payload) {
        Claim claim = get(lineId);
        if (!"Draft".equals(claim.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft claims can be edited");
        }
        claim.setUpdatedBy(userId);
        applyPayload(claim, payload);
        return claims.save(claim);
    }

    @Transactional
    public Claim submit(String userId, String lineId) {
        Claim claim = get(lineId);
        if (claim.getWorkflowInstanceId() != null) {
            return claim;
        }
        claim.setStatus("Forecast");
        claim.setWorkflowState("RUNNING");
        claim.setUpdatedBy(userId);
        claims.save(claim);

        Map<String, Object> variables = new HashMap<>();
        variables.put("requestId", lineId);
        variables.put("businessKey", lineId);
        variables.put("entityType", "CLAIM");
        variables.put("submittedBy", userId);
        variables.put("employeeGroup", "employees");
        variables.put("supervisorGroup", "supervisors");
        variables.put("financeGroup", "finance");
        variables.put("totalAmount", parseAmount(claim.getReportingValue()));
        variables.put("hasDocuments", hasDocuments(claim));
        variables.put("managerReminderDuration", properties.managerReminderDuration());
        variables.put("managerEscalationDuration", properties.managerEscalationDuration());

        ProcessInstanceResponse instance = workflow.start(
                new com.aftermarket.backend.workflow.dto.StartProcessRequest("claimLifecycle", lineId, variables));
        applyInstance(claim, instance);
        claims.save(claim);
        activity.record("WORKFLOW_STARTED", "claimLifecycle", "Claim", lineId, userId, "{}");
        return claim;
    }

    public void applyInstance(Claim claim, ProcessInstanceResponse instance) {
        claim.setWorkflowInstanceId(instance.processInstanceId());
        if (instance.ended()) {
            claim.setWorkflowState("ENDED");
            claim.setCurrentTaskKey(null);
            Object approved = instance.variables() == null ? null : instance.variables().get("approved");
            claim.setStatus(Boolean.TRUE.equals(approved) ? "Completed" : "Rejected");
        } else {
            claim.setWorkflowState("RUNNING");
            String key = instance.activeTaskKeys().isEmpty() ? null : instance.activeTaskKeys().get(0);
            claim.setCurrentTaskKey(key);
            claim.setStatus(deriveStatus(instance));
        }
    }

    public static String deriveStatus(ProcessInstanceResponse instance) {
        if (!instance.ended()) {
            if (instance.activeTaskKeys().contains("financeApproval")) {
                return "Awaiting Finance";
            }
            if (instance.activeTaskKeys().contains("managerApproval")) {
                return "Awaiting Manager";
            }
            return "Forecast";
        }
        Object approved = instance.variables() == null ? null : instance.variables().get("approved");
        return Boolean.TRUE.equals(approved) ? "Completed" : "Rejected";
    }

    private boolean matches(Claim claim, Map<String, String> filters) {
        if (filters == null || filters.isEmpty()) {
            return true;
        }
        for (Map.Entry<String, String> filter : filters.entrySet()) {
            String value = filter.getValue();
            if (value == null || value.isBlank() || value.equals("__any") || value.equals("Any")) {
                continue;
            }
            String actual = switch (filter.getKey()) {
                case "supplierClaimType" -> claim.getSupplierClaimType();
                case "transactionType" -> claim.getTransactionType();
                case "fiscalYear" -> claim.getFiscalYear();
                case "buyerCode" -> claim.getBuyerCode();
                case "pmCode" -> claim.getPmCode();
                case "coc" -> claim.getCoc();
                case "vendorName" -> claim.getVendorName();
                case "status" -> claim.getStatus();
                case "isReserve" -> claim.isReserve() ? "Yes" : "No";
                case "search" -> (claim.getLineId() + " " + claim.getDescription() + " "
                        + claim.getVendorName() + " " + claim.getBuyerCode());
                default -> null;
            };
            if (actual == null) {
                continue;
            }
            if (filter.getKey().equals("search")) {
                if (!actual.toLowerCase().contains(value.toLowerCase())) {
                    return false;
                }
            } else if (!actual.equalsIgnoreCase(value)) {
                return false;
            }
        }
        return true;
    }

    private void applyPayload(Claim claim, Map<String, Object> payload) {
        if (payload == null) {
            return;
        }
        try {
            claim.setPayload(mapper.writeValueAsString(payload));
        } catch (Exception e) {
            claim.setPayload("{}");
        }
        claim.setSupplierClaimType(str(payload, "claimType", claim.getSupplierClaimType()));
        claim.setTransactionType(str(payload, "transactionType", claim.getTransactionType()));
        claim.setFiscalYear(str(payload, "fiscalYear", claim.getFiscalYear()));
        claim.setBuyerCode(str(payload, "buyerCode", claim.getBuyerCode()));
        Object confidential = payload.get("confidential");
        if (confidential != null) {
            claim.setConfidential("Yes".equalsIgnoreCase(String.valueOf(confidential)));
        }
        String vendor = str(payload, "vendor", "");
        if (!vendor.isBlank()) {
            claim.setVendorCode(vendor);
            claim.setVendorName(vendor.replaceFirst("^[A-Z0-9]+ - ", ""));
        }
        String description = str(payload, "description", "");
        if (!description.isBlank()) {
            claim.setDescription(description.length() > 2000 ? description.substring(0, 2000) : description);
        }
        String forecast = str(payload, "annualForecastLocal", "");
        if (!forecast.isBlank()) {
            double local = parseAmount(forecast);
            double gbp = local / 1.27;
            claim.setReportingValue(String.format("%,.4f", gbp));
            claim.setReportingNegative("Risk".equalsIgnoreCase(claim.getSupplierClaimType()));
        }
        String implementation = str(payload, "implementation", "");
        if (!implementation.isBlank()) {
            claim.setImplementationDate(implementation);
        }
    }

    private String str(Map<String, Object> payload, String key, String fallback) {
        Object value = payload.get(key);
        return value == null ? fallback : String.valueOf(value);
    }

    private double parseAmount(String value) {
        if (value == null || value.isBlank() || "-".equals(value.trim())) {
            return 0;
        }
        try {
            return Double.parseDouble(value.replace(",", "").replace("(", "-").replace(")", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    @SuppressWarnings("unchecked")
    private boolean hasDocuments(Claim claim) {
        try {
            Map<String, Object> payload = mapper.readValue(claim.getPayload(), Map.class);
            Object docs = payload.get("docs");
            return docs instanceof List<?> list && !list.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    private String nextLineId() {
        int max = claims.findAll().stream()
                .map(Claim::getLineId)
                .filter(id -> id != null && id.startsWith("MCI-"))
                .mapToInt(id -> {
                    try {
                        return Integer.parseInt(id.substring(4));
                    } catch (NumberFormatException e) {
                        return 0;
                    }
                })
                .max()
                .orElse(160);
        return "MCI-" + String.format("%05d", max + 1);
    }

    public List<Claim> orderedByCreated() {
        return claims.findAll().stream()
                .sorted(Comparator.comparing(Claim::getCreatedOn).reversed())
                .toList();
    }
}
