package com.aftermarket.backend.api;

import com.aftermarket.backend.domain.Ccr;
import com.aftermarket.backend.service.ActivityService;
import com.aftermarket.backend.service.ApprovalViewService;
import com.aftermarket.backend.service.CcrCatalogService;
import com.aftermarket.backend.service.CcrService;
import com.aftermarket.backend.service.IdentityService;
import com.aftermarket.backend.workflow.WorkflowFacade;
import com.aftermarket.backend.workflow.dto.HistoryEntry;
import com.aftermarket.backend.workflow.dto.PendingApprovalView;
import com.aftermarket.backend.workflow.dto.ProcessInstanceResponse;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ccrs")
public class CcrController {

    private final CcrService ccrs;
    private final CcrCatalogService catalog;
    private final WorkflowFacade workflow;
    private final ActivityService activity;
    private final ApprovalViewService approvals;
    private final IdentityService identity;

    public CcrController(
            CcrService ccrs,
            CcrCatalogService catalog,
            WorkflowFacade workflow,
            ActivityService activity,
            ApprovalViewService approvals,
            IdentityService identity) {
        this.ccrs = ccrs;
        this.catalog = catalog;
        this.workflow = workflow;
        this.activity = activity;
        this.approvals = approvals;
        this.identity = identity;
    }

    @GetMapping
    public List<Map<String, Object>> list(
            @RequestParam Map<String, String> filters, Authentication authentication) {
        IdentityService.SessionUser user = identity.sessionFor(authentication.getName());
        Set<String> pendingRefs = approvalRefs(user);
        return ccrs.list().stream()
                .filter(ccr -> visibleTo(ccr, user, pendingRefs))
                .filter(ccr -> matches(ccr, filters))
                .map(this::toRow)
                .toList();
    }

    private boolean visibleTo(Ccr ccr, IdentityService.SessionUser user, Set<String> pendingRefs) {
        if (user.permissions().contains("ccr:read:all")) {
            return true;
        }
        return user.id().equals(ccr.getCreatedBy()) || pendingRefs.contains(ccr.getReference());
    }

    private Set<String> approvalRefs(IdentityService.SessionUser user) {
        return approvals.pending(user).stream()
                .map(PendingApprovalView::requestId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    @PostMapping
    public Map<String, Object> create(
            Authentication authentication, @RequestBody(required = false) Map<String, Object> payload) {
        Ccr saved = ccrs.create(authentication.getName(), payload == null ? Map.of() : payload);
        return toDetail(saved);
    }

    @GetMapping("/{reference}")
    public Map<String, Object> get(@PathVariable String reference) {
        return toDetail(ccrs.get(reference));
    }

    @PutMapping("/{reference}")
    public Map<String, Object> update(
            Authentication authentication,
            @PathVariable String reference,
            @RequestBody(required = false) Map<String, Object> payload) {
        Ccr saved = ccrs.update(authentication.getName(), reference, payload == null ? Map.of() : payload);
        return toDetail(saved);
    }

    @PostMapping("/{reference}/submit")
    public Map<String, Object> submit(Authentication authentication, @PathVariable String reference) {
        Ccr saved = ccrs.submit(authentication.getName(), reference);
        return toDetail(saved);
    }

    @GetMapping("/{reference}/attachments")
    public List<Map<String, Object>> attachments(@PathVariable String reference) {
        return ccrs.attachmentsOf(ccrs.get(reference));
    }

    @GetMapping("/{reference}/history")
    public List<HistoryEntry> history(@PathVariable String reference) {
        Ccr ccr = ccrs.get(reference);
        if (ccr.getWorkflowInstanceId() == null) {
            return List.of();
        }
        return workflow.getHistory(ccr.getWorkflowInstanceId());
    }

    @GetMapping("/{reference}/activity")
    public List<ActivityService.ActivityView> activity(@PathVariable String reference) {
        ccrs.get(reference);
        return activity.forEntityWithActor(reference);
    }

    @GetMapping("/{reference}/instance")
    public ProcessInstanceResponse instance(@PathVariable String reference) {
        Ccr ccr = ccrs.get(reference);
        if (ccr.getWorkflowInstanceId() == null) {
            throw new IllegalArgumentException("CCR has no workflow instance: " + reference);
        }
        return workflow.getInstance(ccr.getWorkflowInstanceId());
    }

    @GetMapping("/catalog/vendors")
    public List<CcrCatalogService.VendorOption> vendors(@RequestParam(required = false) String q) {
        if (q == null || q.isBlank()) {
            return catalog.vendors();
        }
        String query = q.trim().toLowerCase();
        return catalog.vendors().stream()
                .filter(v -> (v.code() + " - " + v.name()).toLowerCase().contains(query))
                .toList();
    }

    @GetMapping("/catalog/parts")
    public List<CcrCatalogService.VendorPart> parts(
            @RequestParam(required = false) String vendor, @RequestParam(required = false) String q) {
        return catalog.parts(vendor, q);
    }

    @GetMapping("/catalog/lookups")
    public Map<String, Object> lookups() {
        return catalog.all();
    }

    Map<String, Object> toRow(Ccr ccr) {
        Map<String, Object> row = new LinkedHashMap<>();
        List<String> partRefs = split(ccr.getPartNumbers());
        List<String> codes = split(ccr.getVendorCodes());
        List<String> names = split(ccr.getVendorNames());
        row.put("reference", ccr.getReference());
        row.put("status", ccr.getStatus());
        row.put("vendorCode", codes.isEmpty() ? "" : codes.get(0));
        row.put("vendorName", names.isEmpty() ? (codes.isEmpty() ? "" : codes.get(0)) : names.get(0));
        row.put("signoffLevel", ccr.getSignoffLevel());
        row.put("dateRequested", ccr.getCreatedOn() == null ? null : ccr.getCreatedOn().toString().substring(0, 10));
        row.put("lastUpdated", ccr.getUpdatedOn() == null ? null : ccr.getUpdatedOn().toString().substring(0, 10));
        row.put("recentUpdate", ccr.getRecentUpdate());
        row.put("netPriceChange", ccr.isNetPriceChange());
        row.put("leadTimeChange", ccr.isLeadTimeChange());
        row.put("moqChange", ccr.isMoqChange());
        row.put("atb", ccr.isAtb());
        row.put("bb", ccr.isBb());
        row.put("missingRefData", ccr.isMissingRefData());
        row.put("supplyOk", ccr.isSupplyOk());
        row.put("priority", ccr.getPriority());
        row.put("ccrType", ccr.getCcrType());
        row.put("kind", ccr.getKind());
        row.put("partRefs", partRefs);
        row.put("vendorCodes", codes);
        return row;
    }

    Map<String, Object> toDetail(Ccr ccr) {
        Map<String, Object> detail = toRow(ccr);
        detail.put("justification", ccr.getJustification());
        detail.put("onBehalfReason", ccr.getOnBehalfReason());
        detail.put("workflowInstanceId", ccr.getWorkflowInstanceId());
        detail.put("workflowState", ccr.getWorkflowState());
        detail.put("currentTaskKey", ccr.getCurrentTaskKey());
        try {
            detail.put("payload", new com.fasterxml.jackson.databind.ObjectMapper().readValue(ccr.getPayload(), Map.class));
        } catch (Exception e) {
            detail.put("payload", Map.of());
        }
        detail.put("attachments", ccrs.attachmentsOf(ccr));
        return detail;
    }

    private boolean matches(Ccr ccr, Map<String, String> filters) {
        if (filters == null || filters.isEmpty()) {
            return true;
        }
        Map<String, Object> row = toRow(ccr);
        for (Map.Entry<String, String> filter : filters.entrySet()) {
            String value = filter.getValue();
            if (value == null || value.isBlank() || value.equals("__any") || value.equals("Any")) {
                continue;
            }
            switch (filter.getKey()) {
                case "vendorQuery" -> {
                    String haystack = String.valueOf(row.get("vendorName")) + " " + row.get("vendorCode");
                    if (!haystack.toLowerCase().contains(value.toLowerCase())) {
                        return false;
                    }
                }
                case "partQuery" -> {
                    @SuppressWarnings("unchecked")
                    List<String> refs = (List<String>) row.get("partRefs");
                    if (refs.stream().noneMatch(p -> p.toLowerCase().contains(value.toLowerCase()))) {
                        return false;
                    }
                }
                case "codeRefQuery" -> {
                    String haystack = row.get("vendorCode") + " " + row.get("reference");
                    if (!haystack.toLowerCase().contains(value.toLowerCase())) {
                        return false;
                    }
                }
                case "ccrType" -> {
                    if (!value.equalsIgnoreCase(String.valueOf(row.get("ccrType")))) {
                        return false;
                    }
                }
                case "priority" -> {
                    if (!value.equalsIgnoreCase(String.valueOf(row.get("priority")))) {
                        return false;
                    }
                }
                case "status" -> {
                    if (!value.equalsIgnoreCase(String.valueOf(row.get("status")))) {
                        return false;
                    }
                }
                case "dateRequested" -> {
                    int days = switch (value) {
                        case "Last 7 days" -> 7;
                        case "Last 30 days" -> 30;
                        case "Last 90 days" -> 90;
                        default -> 0;
                    };
                    if (days > 0 && ccr.getCreatedOn() != null
                            && ccr.getCreatedOn().isBefore(Instant.now().minus(days, ChronoUnit.DAYS))) {
                        return false;
                    }
                }
                default -> {
                }
            }
        }
        return true;
    }

    private List<String> split(String value) {
        if (value == null || value.isBlank()) {
            return new ArrayList<>();
        }
        return new ArrayList<>(Arrays.stream(value.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList());
    }
}
