package com.aftermarket.backend.api;

import com.aftermarket.backend.service.ApprovalViewService;
import com.aftermarket.backend.service.IdentityService;
import com.aftermarket.backend.workflow.dto.ApprovalDecisionItem;
import com.aftermarket.backend.workflow.dto.PendingApprovalView;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    private final ApprovalViewService approvals;
    private final IdentityService identity;

    public ApprovalController(ApprovalViewService approvals, IdentityService identity) {
        this.approvals = approvals;
        this.identity = identity;
    }

    @GetMapping("/pending")
    public List<PendingApprovalView> pending(Authentication authentication) {
        return approvals.pending(identity.sessionFor(authentication.getName()));
    }

    @GetMapping("/decided")
    public List<ApprovalDecisionItem> decided(Authentication authentication) {
        return approvals.decided(identity.sessionFor(authentication.getName()));
    }
}
