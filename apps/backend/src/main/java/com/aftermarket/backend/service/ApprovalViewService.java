package com.aftermarket.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

import com.aftermarket.backend.domain.AppUser;
import com.aftermarket.backend.domain.BaseEntity;
import com.aftermarket.backend.domain.Ccr;
import com.aftermarket.backend.domain.Claim;
import com.aftermarket.backend.domain.MandateRequest;
import com.aftermarket.backend.domain.TaskDecision;
import com.aftermarket.backend.repo.AppUserRepository;
import com.aftermarket.backend.repo.CcrRepository;
import com.aftermarket.backend.repo.ClaimRepository;
import com.aftermarket.backend.repo.MandateRequestRepository;
import com.aftermarket.backend.repo.TaskDecisionRepository;
import com.aftermarket.backend.service.IdentityService.SessionUser;
import com.aftermarket.backend.workflow.WorkflowFacade;
import com.aftermarket.backend.workflow.dto.ApprovalDecisionItem;
import com.aftermarket.backend.workflow.dto.PendingApprovalView;
import com.aftermarket.backend.workflow.dto.TaskResponse;

/**
 * Role aware approval views. "Pending" is what waits for the user (their approval queue) or on a
 * request they raised; "decided" is what they approved or what was decided on their requests.
 */
@Service
public class ApprovalViewService {

    private final WorkflowFacade workflow;
    private final ClaimRepository claims;
    private final MandateRequestRepository mandates;
    private final CcrRepository ccrs;
    private final TaskDecisionRepository decisions;
    private final AppUserRepository users;

    public ApprovalViewService(
            WorkflowFacade workflow,
            ClaimRepository claims,
            MandateRequestRepository mandates,
            CcrRepository ccrs,
            TaskDecisionRepository decisions,
            AppUserRepository users) {
        this.workflow = workflow;
        this.claims = claims;
        this.mandates = mandates;
        this.ccrs = ccrs;
        this.decisions = decisions;
        this.users = users;
    }

    public List<PendingApprovalView> pending(SessionUser user) {
        Map<String, TaskResponse> tasks = new LinkedHashMap<>();
        for (String group : user.groups()) {
            for (TaskResponse task : workflow.listTasks(null, group, null)) {
                tasks.put(task.taskId(), task);
            }
        }
        for (TaskResponse task : workflow.listTasks(user.id(), null, null)) {
            tasks.put(task.taskId(), task);
        }
        for (Claim claim : claims.findByCreatedByOrderByCreatedOnDesc(user.id())) {
            if (claim.getWorkflowInstanceId() == null) {
                continue;
            }
            for (TaskResponse task : workflow.listTasks(null, null, claim.getWorkflowInstanceId())) {
                tasks.put(task.taskId(), task);
            }
        }
        for (MandateRequest mandate : mandates.findByCreatedByOrderByCreatedOnDesc(user.id())) {
            if (mandate.getWorkflowInstanceId() == null) {
                continue;
            }
            for (TaskResponse task : workflow.listTasks(null, null, mandate.getWorkflowInstanceId())) {
                tasks.put(task.taskId(), task);
            }
        }
        for (Ccr ccr : ccrs.findByCreatedByOrderByCreatedOnDesc(user.id())) {
            if (ccr.getWorkflowInstanceId() == null) {
                continue;
            }
            for (TaskResponse task : workflow.listTasks(null, null, ccr.getWorkflowInstanceId())) {
                tasks.put(task.taskId(), task);
            }
        }
        List<PendingApprovalView> views = new ArrayList<>();
        for (TaskResponse task : tasks.values()) {
            views.add(toPendingView(user, task));
        }
        return views;
    }

    public List<ApprovalDecisionItem> decided(SessionUser user) {
        Set<String> raisedByMe = new HashSet<>();
        for (Claim claim : claims.findByCreatedByOrderByCreatedOnDesc(user.id())) {
            raisedByMe.add(claim.getLineId());
        }
        for (MandateRequest mandate : mandates.findByCreatedByOrderByCreatedOnDesc(user.id())) {
            raisedByMe.add(mandate.getNumber());
        }
        for (Ccr ccr : ccrs.findByCreatedByOrderByCreatedOnDesc(user.id())) {
            raisedByMe.add(ccr.getReference());
        }

        Map<String, TaskDecision> merged = new LinkedHashMap<>();
        for (TaskDecision decision : decisions.findByActorIdOrderByCreatedOnDesc(user.id())) {
            merged.put(decision.getId(), decision);
        }
        if (!raisedByMe.isEmpty()) {
            for (TaskDecision decision : decisions.findByRequestIdInOrderByCreatedOnDesc(raisedByMe)) {
                merged.put(decision.getId(), decision);
            }
        }
        return merged.values().stream()
                .sorted(Comparator.comparing(BaseEntity::getCreatedOn).reversed())
                .map(this::toDecisionItem)
                .toList();
    }

    private PendingApprovalView toPendingView(SessionUser user, TaskResponse task) {
        String requestId = task.businessKey();
        Claim claim = requestId == null ? null : claims.findByLineId(requestId).orElse(null);
        MandateRequest mandate = requestId == null || claim != null
                ? null
                : mandates.findByNumber(requestId).orElse(null);
        Ccr ccr = requestId == null || claim != null || mandate != null
                ? null
                : ccrs.findByReference(requestId).orElse(null);

        String requestType = ccr != null ? "CCR" : mandate != null ? "Mandate" : "Claim";
        String description = null;
        String vendor = null;
        String value = null;
        String raisedById = null;
        if (mandate != null) {
            description = mandate.getCategory() == null ? mandate.getClaimIds() : mandate.getCategory();
            raisedById = mandate.getCreatedBy();
        } else if (ccr != null) {
            description = ccr.getJustification();
            String names = ccr.getVendorNames();
            vendor = names == null || names.isBlank() ? ccr.getVendorCodes() : names.split(",")[0].trim();
            value = ccr.getPartNumbers();
            raisedById = ccr.getCreatedBy();
        } else if (claim != null) {
            description = claim.getDescription();
            vendor = claim.getVendorName();
            value = claim.getReportingValue();
            raisedById = claim.getCreatedBy();
        }

        boolean canAct = (task.assignee() != null && task.assignee().equals(user.id()))
                || (task.candidateGroups() != null
                        && task.candidateGroups().stream().anyMatch(user.groups()::contains));

        return new PendingApprovalView(
                task.taskId(),
                task.name(),
                task.taskDefinitionKey(),
                requestId,
                requestType,
                description,
                vendor,
                value,
                raisedById,
                userName(raisedById),
                task.createdTime(),
                canAct,
                task.candidateGroups() == null ? List.of() : task.candidateGroups());
    }

    private ApprovalDecisionItem toDecisionItem(TaskDecision decision) {
        String requestType = "Mandate";
        if (claims.findByLineId(decision.getRequestId()).isPresent()) {
            requestType = "Claim";
        } else if (ccrs.findByReference(decision.getRequestId()).isPresent()) {
            requestType = "CCR";
        }
        return new ApprovalDecisionItem(
                decision.getTaskId(),
                decision.getRequestId(),
                requestType,
                decision.getTaskName(),
                decision.getDecision(),
                decision.getComment(),
                decision.getActorId(),
                userName(decision.getActorId()),
                decision.getCreatedOn());
    }

    private String userName(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }
        return users.findById(userId).map(AppUser::getName).orElse(null);
    }
}
