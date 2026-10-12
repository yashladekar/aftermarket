package com.aftermarket.backend.api;

import com.aftermarket.backend.domain.Claim;
import com.aftermarket.backend.service.ClaimService;
import com.aftermarket.backend.workflow.WorkflowFacade;
import com.aftermarket.backend.workflow.dto.HistoryEntry;
import com.aftermarket.backend.workflow.dto.ProcessInstanceResponse;
import java.util.List;
import java.util.Map;
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
@RequestMapping("/api/claims")
public class ClaimController {

    private final ClaimService claims;
    private final WorkflowFacade workflow;

    public ClaimController(ClaimService claims, WorkflowFacade workflow) {
        this.claims = claims;
        this.workflow = workflow;
    }

    @GetMapping
    public List<Claim> list(@RequestParam Map<String, String> filters) {
        return claims.list(filters);
    }

    @PostMapping
    public Claim create(Authentication authentication, @RequestBody(required = false) Map<String, Object> payload) {
        return claims.create(authentication.getName(), payload == null ? Map.of() : payload);
    }

    @GetMapping("/{lineId}")
    public Claim get(@PathVariable String lineId) {
        return claims.get(lineId);
    }

    @PutMapping("/{lineId}")
    public Claim update(
            Authentication authentication,
            @PathVariable String lineId,
            @RequestBody(required = false) Map<String, Object> payload) {
        return claims.update(authentication.getName(), lineId, payload == null ? Map.of() : payload);
    }

    @PostMapping("/{lineId}/submit")
    public Claim submit(Authentication authentication, @PathVariable String lineId) {
        return claims.submit(authentication.getName(), lineId);
    }

    @GetMapping("/{lineId}/history")
    public List<HistoryEntry> history(@PathVariable String lineId) {
        Claim claim = claims.get(lineId);
        if (claim.getWorkflowInstanceId() == null) {
            return List.of();
        }
        return workflow.getHistory(claim.getWorkflowInstanceId());
    }

    @GetMapping("/{lineId}/instance")
    public ProcessInstanceResponse instance(@PathVariable String lineId) {
        Claim claim = claims.get(lineId);
        if (claim.getWorkflowInstanceId() == null) {
            throw new IllegalArgumentException("Claim has no workflow instance: " + lineId);
        }
        return workflow.getInstance(claim.getWorkflowInstanceId());
    }
}
