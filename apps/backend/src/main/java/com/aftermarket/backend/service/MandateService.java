package com.aftermarket.backend.service;

import com.aftermarket.backend.domain.MandateRequest;
import com.aftermarket.backend.repo.MandateRequestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MandateService {

    private final MandateRequestRepository mandates;
    private final ActivityService activity;
    private final ObjectMapper mapper;

    public MandateService(
            MandateRequestRepository mandates,
            ActivityService activity,
            ObjectMapper mapper) {
        this.mandates = mandates;
        this.activity = activity;
        this.mapper = mapper;
    }

    public List<MandateRequest> list() {
        return mandates.findAllByOrderByCreatedOnDesc();
    }

    public MandateRequest get(String number) {
        return mandates.findByNumber(number)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mandate not found: " + number));
    }

    @Transactional
    public MandateRequest create(String userId, String userName, Map<String, Object> payload) {
        MandateRequest mandate = new MandateRequest();
        mandate.setNumber(nextNumber());
        mandate.setCreatedBy(userId);
        mandate.setRaiser(userName == null ? "Buyer Officer" : userName);
        applyPayload(mandate, payload);
        MandateRequest saved = mandates.save(mandate);
        activity.record("MANDATE_CREATED", saved.getNumber(), "MandateRequest", saved.getNumber(), userId, "{}");
        return saved;
    }

    public void applyInstance(MandateRequest mandate,
            com.aftermarket.backend.workflow.dto.ProcessInstanceResponse instance) {
        mandate.setWorkflowInstanceId(instance.processInstanceId());
        if (instance.ended()) {
            mandate.setWorkflowState("ENDED");
            mandate.setCurrentTaskKey(null);
        } else {
            mandate.setWorkflowState("RUNNING");
            if (!instance.activeTaskKeys().isEmpty()) {
                mandate.setCurrentTaskKey(instance.activeTaskKeys().get(0));
            }
        }
    }

    private void applyPayload(MandateRequest mandate, Map<String, Object> payload) {
        if (payload == null) {
            return;
        }
        try {
            mandate.setPayload(mapper.writeValueAsString(payload));
        } catch (Exception e) {
            mandate.setPayload("{}");
        }
        mandate.setCategory(str(payload, "category", mandate.getCategory()));
        mandate.setStakeholders(str(payload, "stakeholders", mandate.getStakeholders()));
        Object claimIds = payload.get("claimIds");
        if (claimIds instanceof List<?> list) {
            mandate.setClaimIds(String.join(",", list.stream().map(String::valueOf).toList()));
        } else if (payload.get("claimId") != null) {
            mandate.setClaimIds(String.valueOf(payload.get("claimId")));
        }
    }

    private String str(Map<String, Object> payload, String key, String fallback) {
        Object value = payload.get(key);
        return value == null ? fallback : String.valueOf(value);
    }

    private String nextNumber() {
        int max = mandates.findAll().stream()
                .map(MandateRequest::getNumber)
                .mapToInt(number -> {
                    try {
                        return Integer.parseInt(number);
                    } catch (NumberFormatException e) {
                        return 63;
                    }
                })
                .max()
                .orElse(63);
        return String.valueOf(max + 1);
    }
}
