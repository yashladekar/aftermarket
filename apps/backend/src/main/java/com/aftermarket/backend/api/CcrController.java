package com.aftermarket.backend.api;

import com.aftermarket.backend.domain.MandateRequest;
import com.aftermarket.backend.service.CcrService;
import com.aftermarket.backend.service.IdentityService;
import com.aftermarket.backend.workflow.dto.ProcessInstanceResponse;

import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for CCR (Commercial Change Request) submission and workflow.
 * Endpoints:
 *   POST /api/ccr          – create a CCR record and start the ccrApproval process
 *   GET  /api/ccr/{number} – retrieve a CCR record by its request number
 *   GET  /api/ccr/{number}/instance – retrieve the live workflow state
 */
@RestController
@RequestMapping("/api/ccr")
public class CcrController {

    private final CcrService ccrService;
    private final IdentityService identity;

    public CcrController(CcrService ccrService, IdentityService identity) {
        this.ccrService = ccrService;
        this.identity = identity;
    }

    /**
     * Submit a CCR. Creates a MandateRequest record (reusing existing entity) and
     * immediately starts the ccrApproval Flowable process.
     * The request body is optional; all fields are treated as supplementary metadata.
     */
    @PostMapping
    public MandateRequest submit(
            Authentication authentication,
            @RequestBody(required = false) Map<String, Object> payload) {
        IdentityService.SessionUser user = identity.sessionFor(authentication.getName());
        return ccrService.submitCcr(user.id(), user.name(), payload == null ? Map.of() : payload);
    }

    @GetMapping("/{number}")
    public MandateRequest get(@PathVariable String number) {
        return ccrService.get(number);
    }

    @GetMapping("/{number}/instance")
    public ProcessInstanceResponse instance(@PathVariable String number) {
        return ccrService.getInstance(number);
    }
}

