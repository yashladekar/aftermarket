package com.aftermarket.backend.service;

import com.aftermarket.backend.domain.MandateRequest;
import com.aftermarket.backend.repo.MandateRequestRepository;
import com.aftermarket.backend.workflow.WorkflowFacade;
import com.aftermarket.backend.workflow.dto.ProcessInstanceResponse;
import com.aftermarket.backend.workflow.dto.StartProcessRequest;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Business service for CCR (Commercial Change Request) submissions.
 * Reuses MandateRequest as the backing entity (same table, same repository).
 * Starts the "ccrApproval" Flowable process with:
 *   aftermarketGroup = "supervisors"   (Aftermarket approval step)
 *   financeGroup     = "finance"       (Finance approval step)
 */
@Service
public class CcrService {

    /** Flowable process definition key for the CCR approval workflow. */
    public static final String PROCESS_KEY = "ccrApproval";

    /** Group keys used in BPMN candidate groups. */
    private static final String AFTERMARKET_GROUP = "supervisors";
    private static final String FINANCE_GROUP = "finance";

    private final MandateRequestRepository mandates;
    private final WorkflowFacade workflow;
    private final ActivityService activity;
    private final ObjectMapper mapper;

    public CcrService(
            MandateRequestRepository mandates,
            WorkflowFacade workflow,
            ActivityService activity,
            ObjectMapper mapper) {
        this.mandates = mandates;
        this.workflow = workflow;
        this.activity = activity;
        this.mapper = mapper;
    }

    public MandateRequest get(String number) {
        return mandates.findByNumber(number)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CCR not found: " + number));
    }

    public ProcessInstanceResponse getInstance(String number) {
        MandateRequest mandate = get(number);
        if (mandate.getWorkflowInstanceId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CCR has no active workflow: " + number);
        }
        return workflow.getInstance(mandate.getWorkflowInstanceId());
    }

    /**
     * Creates a new CCR record and immediately starts the ccrApproval process.
     * Using requestType = "CCR" to distinguish from Mandate records.
     */
    @Transactional
    public MandateRequest submitCcr(String userId, String userName, Map<String, Object> payload) {
        MandateRequest mandate = new MandateRequest();
        mandate.setNumber(nextCcrNumber());
        mandate.setRequestType("CCR");
        mandate.setCategory(str(payload, "category", "Commercial Change Request"));
        mandate.setLevel("Aftermarket");
        mandate.setOverall("Pending Aftermarket Approval");
        mandate.setClearing("Pending");
        mandate.setDoa("Pending");
        mandate.setWorkflowState("RUNNING");
        mandate.setRaiser(userName != null ? userName : "Buyer Officer");
        mandate.setVendorCode(str(payload, "vendorCode", ""));
        mandate.setVendorName(str(payload, "vendorName", ""));
        mandate.setStakeholders(str(payload, "stakeholders", ""));
        mandate.setCreatedBy(userId);
        try {
            mandate.setPayload(mapper.writeValueAsString(payload));
        } catch (Exception e) {
            mandate.setPayload("{}");
        }

        MandateRequest saved = mandates.save(mandate);
        activity.record("CCR_CREATED", saved.getNumber(), "MandateRequest", saved.getNumber(), userId, "{}");

        // Start the ccrApproval workflow
        Map<String, Object> variables = new HashMap<>();
        variables.put("requestId", saved.getNumber());
        variables.put("businessKey", saved.getNumber());
        variables.put("entityType", "CCR");
        variables.put("submittedBy", userId);
        variables.put("aftermarketGroup", AFTERMARKET_GROUP);
        variables.put("financeGroup", FINANCE_GROUP);

        ProcessInstanceResponse instance = workflow.start(
                new StartProcessRequest(PROCESS_KEY, saved.getNumber(), variables));

        saved.setWorkflowInstanceId(instance.processInstanceId());
        saved.setWorkflowState("RUNNING");
        if (!instance.activeTaskKeys().isEmpty()) {
            saved.setCurrentTaskKey(instance.activeTaskKeys().get(0));
        }
        MandateRequest result = mandates.save(saved);
        activity.record("WORKFLOW_STARTED", PROCESS_KEY, "MandateRequest", saved.getNumber(), userId, "{}");
        return result;
    }

    private String str(Map<String, Object> payload, String key, String fallback) {
        Object v = payload.get(key);
        return v == null ? fallback : String.valueOf(v);
    }

    private String nextCcrNumber() {
        // Generate a CCR-prefixed number to distinguish from legacy mandate numbers
        long count = mandates.findAll().stream()
                .filter(m -> "CCR".equals(m.getRequestType()))
                .count();
        return "CCR-" + String.format("%04d", count + 1);
    }
}

