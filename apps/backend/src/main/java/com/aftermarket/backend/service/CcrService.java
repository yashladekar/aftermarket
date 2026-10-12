package com.aftermarket.backend.service;

import com.aftermarket.backend.config.AftermarketProperties;
import com.aftermarket.backend.domain.Ccr;
import com.aftermarket.backend.repo.CcrRepository;
import com.aftermarket.backend.workflow.WorkflowFacade;
import com.aftermarket.backend.workflow.dto.ProcessInstanceResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CcrService {

    private final CcrRepository ccrs;
    private final CcrCatalogService catalog;
    private final WorkflowFacade workflow;
    private final ActivityService activity;
    private final AftermarketProperties properties;
    private final ObjectMapper mapper;

    public CcrService(
            CcrRepository ccrs,
            CcrCatalogService catalog,
            WorkflowFacade workflow,
            ActivityService activity,
            AftermarketProperties properties,
            ObjectMapper mapper) {
        this.ccrs = ccrs;
        this.catalog = catalog;
        this.workflow = workflow;
        this.activity = activity;
        this.properties = properties;
        this.mapper = mapper;
    }

    public List<Ccr> list() {
        return ccrs.findAllByOrderByCreatedOnDesc();
    }

    public Ccr get(String reference) {
        return ccrs.findByReference(reference)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CCR not found: " + reference));
    }

    @Transactional
    public Ccr create(String userId, Map<String, Object> payload) {
        Ccr ccr = new Ccr();
        ccr.setReference(nextReference(firstVendorCode(payload)));
        ccr.setStatus("Draft");
        ccr.setRecentUpdate("CCR Created");
        ccr.setCreatedBy(userId);
        applyPayload(ccr, payload);
        Ccr saved = ccrs.save(ccr);
        activity.record("CCR_CREATED", saved.getReference(), "Ccr", saved.getReference(), userId, "{}");
        return saved;
    }

    @Transactional
    public Ccr update(String userId, String reference, Map<String, Object> payload) {
        Ccr ccr = get(reference);
        if (!"Draft".equals(ccr.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft CCRs can be edited");
        }
        ccr.setUpdatedBy(userId);
        ccr.setRecentUpdate("CCR Updated");
        applyPayload(ccr, payload);
        return ccrs.save(ccr);
    }

    @Transactional
    public Ccr submit(String userId, String reference) {
        Ccr ccr = get(reference);
        if (ccr.getWorkflowInstanceId() != null) {
            return ccr;
        }
        requireComplete(ccr);
        ccr.setStatus("Pending Approval");
        ccr.setSignoffLevel("--");
        ccr.setRecentUpdate("CCR Submitted");
        ccr.setWorkflowState("RUNNING");
        ccr.setUpdatedBy(userId);
        ccrs.save(ccr);

        Map<String, Object> variables = new HashMap<>();
        variables.put("requestId", reference);
        variables.put("businessKey", reference);
        variables.put("entityType", "CCR");
        variables.put("submittedBy", userId);
        variables.put("employeeGroup", "employees");
        variables.put("supervisorGroup", "supervisors");
        variables.put("financeGroup", "finance");
        variables.put("managerReminderDuration", properties.managerReminderDuration());
        variables.put("managerEscalationDuration", properties.managerEscalationDuration());

        ProcessInstanceResponse instance = workflow.start(
                new com.aftermarket.backend.workflow.dto.StartProcessRequest("ccrApproval", reference, variables));
        applyInstance(ccr, instance);
        ccrs.save(ccr);
        activity.record("WORKFLOW_STARTED", "ccrApproval", "Ccr", reference, userId, "{}");
        return ccr;
    }

    public void applyInstance(Ccr ccr, ProcessInstanceResponse instance) {
        ccr.setWorkflowInstanceId(instance.processInstanceId());
        if (instance.ended()) {
            ccr.setWorkflowState("ENDED");
            ccr.setCurrentTaskKey(null);
            Object approved = instance.variables() == null ? null : instance.variables().get("approved");
            ccr.setStatus(Boolean.TRUE.equals(approved) ? "Approved" : "Rejected");
            ccr.setRecentUpdate(Boolean.TRUE.equals(approved) ? "CCR Approved" : "CCR Rejected");
        } else {
            ccr.setWorkflowState("RUNNING");
            String key = instance.activeTaskKeys().isEmpty() ? null : instance.activeTaskKeys().get(0);
            ccr.setCurrentTaskKey(key);
            ccr.setStatus(deriveStatus(instance));
            ccr.setRecentUpdate(
                    "financeApproval".equals(key) ? "Awaiting Finance Approval" : "Awaiting Manager Approval");
        }
    }

    public static String deriveStatus(ProcessInstanceResponse instance) {
        if (!instance.ended()) {
            if (instance.activeTaskKeys().contains("financeApproval")) {
                return "Awaiting Finance";
            }
            if (instance.activeTaskKeys().contains("managerApproval")) {
                return "Pending Approval";
            }
            return "Pending Validation";
        }
        Object approved = instance.variables() == null ? null : instance.variables().get("approved");
        return Boolean.TRUE.equals(approved) ? "Approved" : "Rejected";
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> attachmentsOf(Ccr ccr) {
        try {
            Map<String, Object> payload = mapper.readValue(ccr.getPayload(), Map.class);
            Object documents = payload.get("documents");
            if (documents instanceof List<?> list) {
                List<Map<String, Object>> out = new ArrayList<>();
                for (Object item : list) {
                    if (item instanceof Map<?, ?> map) {
                        Map<String, Object> row = new HashMap<>();
                        map.forEach((key, value) -> row.put(String.valueOf(key), value));
                        out.add(row);
                    }
                }
                return out;
            }
        } catch (Exception ignored) {
        }
        return List.of();
    }

    private void requireComplete(Ccr ccr) {
        if (ccr.getVendorCodes() == null || ccr.getVendorCodes().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one vendor before submitting");
        }
        if (ccr.getPartNumbers() == null || ccr.getPartNumbers().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one part before submitting");
        }
        if (ccr.getJustification() == null || ccr.getJustification().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Justification is required before submitting");
        }
    }

    private void applyPayload(Ccr ccr, Map<String, Object> payload) {
        if (payload == null) {
            return;
        }
        try {
            ccr.setPayload(mapper.writeValueAsString(payload));
        } catch (Exception e) {
            ccr.setPayload("{}");
        }
        String kind = str(payload, "kind", ccr.getKind());
        ccr.setKind("alb".equalsIgnoreCase(kind) ? "alb" : "standard");

        List<String> vendorCodes = strList(payload, "vendors", "vendorCodes");
        if (!vendorCodes.isEmpty()) {
            ccr.setVendorCodes(String.join(",", vendorCodes));
            ccr.setVendorNames(resolveVendorNames(payload, vendorCodes));
        }
        List<String> parts = strList(payload, "parts", "partNumbers");
        if (!parts.isEmpty()) {
            ccr.setPartNumbers(String.join(",", parts));
        }
        String justification = str(payload, "justification", "");
        if (!justification.isBlank()) {
            ccr.setJustification(justification.length() > 2000 ? justification.substring(0, 2000) : justification);
        }
        String onBehalf = str(payload, "onBehalfReason", "");
        if (!onBehalf.isBlank()) {
            ccr.setOnBehalfReason(onBehalf);
        }
        String priority = str(payload, "priority", "");
        if (!priority.isBlank()) {
            ccr.setPriority(priority);
        }

        List<Map<String, Object>> rows = rowList(payload.get("partRows"));
        boolean net = false;
        boolean lead = false;
        boolean moq = false;
        for (Map<String, Object> row : rows) {
            if (!isBlank(row.get("newNetPrice"))) {
                net = true;
            }
            if (!isBlank(row.get("newLeadTime"))) {
                lead = true;
            }
            if (!isBlank(row.get("newMoq")) || !isBlank(row.get("newOrderMultiple")) || !isBlank(row.get("newPer"))) {
                moq = true;
            }
        }
        if (!rows.isEmpty() || payload.containsKey("partRows")) {
            ccr.setNetPriceChange(net);
            ccr.setLeadTimeChange(lead);
            ccr.setMoqChange(moq);
        }
        String ccrType = str(payload, "ccrType", "");
        if (ccrType.isBlank()) {
            ccrType = net ? "Price Change" : (lead || moq) ? "Logistics Change" : ccr.getCcrType();
        }
        ccr.setCcrType(ccrType);
    }

    private String resolveVendorNames(Map<String, Object> payload, List<String> vendorCodes) {
        Object vendors = payload.get("vendors");
        if (vendors instanceof List<?> list) {
            Map<String, String> names = new HashMap<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    Object code = map.get("code");
                    Object name = map.get("name");
                    if (code != null && name != null) {
                        names.put(String.valueOf(code), String.valueOf(name));
                    }
                }
            }
            if (!names.isEmpty()) {
                List<String> ordered = new ArrayList<>();
                for (String code : vendorCodes) {
                    ordered.add(names.getOrDefault(code, catalog.vendorName(code)));
                }
                return String.join(",", ordered);
            }
        }
        Object names = payload.get("vendorNames");
        if (names instanceof String text && !text.isBlank()) {
            return text;
        }
        List<String> resolved = new ArrayList<>();
        for (String code : vendorCodes) {
            resolved.add(catalog.vendorName(code));
        }
        return String.join(",", resolved);
    }

    private String firstVendorCode(Map<String, Object> payload) {
        if (payload == null) {
            return "";
        }
        List<String> codes = strList(payload, "vendors", "vendorCodes");
        return codes.isEmpty() ? "" : codes.get(0);
    }

    private String str(Map<String, Object> payload, String key, String fallback) {
        Object value = payload.get(key);
        return value == null ? fallback : String.valueOf(value);
    }

    private List<String> strList(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value instanceof List<?> list) {
                List<String> out = new ArrayList<>();
                for (Object item : list) {
                    if (item instanceof Map<?, ?> map) {
                        Object code = map.get("code");
                        if (code != null && !String.valueOf(code).isBlank()) {
                            out.add(String.valueOf(code));
                        }
                    } else if (item != null && !String.valueOf(item).isBlank()) {
                        out.add(String.valueOf(item));
                    }
                }
                if (!out.isEmpty()) {
                    return out;
                }
            } else if (value instanceof String text && !text.isBlank()) {
                return Arrays.stream(text.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
            }
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> rowList(Object value) {
        if (value instanceof List<?> list) {
            List<Map<String, Object>> out = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    Map<String, Object> row = new HashMap<>();
                    map.forEach((key, entry) -> row.put(String.valueOf(key), entry));
                    out.add(row);
                }
            }
            return out;
        }
        return List.of();
    }

    private boolean isBlank(Object value) {
        return value == null || String.valueOf(value).isBlank();
    }

    private String nextReference(String vendorCode) {
        String code = vendorCode == null || vendorCode.isBlank() ? "GEN" : vendorCode;
        int max = ccrs.findAll().stream()
                .map(Ccr::getReference)
                .filter(reference -> reference != null && reference.startsWith("CCR-"))
                .mapToInt(reference -> {
                    try {
                        return Integer.parseInt(reference.substring(reference.lastIndexOf('-') + 1));
                    } catch (NumberFormatException e) {
                        return 0;
                    }
                })
                .max()
                .orElse(1042);
        return "CCR-" + code + "-" + (max + 1);
    }
}
