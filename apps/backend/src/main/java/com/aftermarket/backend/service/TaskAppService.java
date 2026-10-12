package com.aftermarket.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.aftermarket.backend.domain.AppUser;
import com.aftermarket.backend.domain.Claim;
import com.aftermarket.backend.domain.MandateRequest;
import com.aftermarket.backend.domain.TaskDecision;
import com.aftermarket.backend.repo.AppUserRepository;
import com.aftermarket.backend.repo.ClaimRepository;
import com.aftermarket.backend.repo.MandateRequestRepository;
import com.aftermarket.backend.repo.TaskDecisionRepository;
import com.aftermarket.backend.service.IdentityService.SessionUser;
import com.aftermarket.backend.workflow.WorkflowFacade;
import com.aftermarket.backend.workflow.dto.ClaimDecisionView;
import com.aftermarket.backend.workflow.dto.ClaimTaskView;
import com.aftermarket.backend.workflow.dto.CompleteTaskRequest;
import com.aftermarket.backend.workflow.dto.ProcessInstanceResponse;
import com.aftermarket.backend.workflow.dto.TaskResponse;

@Service
public class TaskAppService {

    private final WorkflowFacade workflow;
    private final ClaimRepository claims;
    private final MandateRequestRepository mandates;
    private final TaskDecisionRepository decisions;
    private final AppUserRepository users;
    private final ClaimService claimService;
    private final MandateService mandateService;
    private final ActivityService activity;

    public TaskAppService(
            WorkflowFacade workflow,
            ClaimRepository claims,
            MandateRequestRepository mandates,
            TaskDecisionRepository decisions,
            AppUserRepository users,
            ClaimService claimService,
            MandateService mandateService,
            ActivityService activity) {
        this.workflow = workflow;
        this.claims = claims;
        this.mandates = mandates;
        this.decisions = decisions;
        this.users = users;
        this.claimService = claimService;
        this.mandateService = mandateService;
        this.activity = activity;
    }

    public List<TaskResponse> listForUser(SessionUser user) {
        List<TaskResponse> tasks = new ArrayList<>();
        for (String group : user.groups()) {
            tasks.addAll(workflow.listTasks(null, group, null));
        }
        tasks.addAll(workflow.listTasks(user.id(), null, null));
        java.util.LinkedHashMap<String, TaskResponse> dedup = new java.util.LinkedHashMap<>();
        for (TaskResponse task : tasks) {
            dedup.put(task.taskId(), task);
        }
        return new ArrayList<>(dedup.values());
    }

    public TaskResponse getForUser(SessionUser user, String taskId) {
        TaskResponse task = workflow.getTask(taskId);
        assertCanAct(user, task);
        return task;
    }

    public ProcessInstanceResponse complete(SessionUser user, String taskId, Map<String, Object> variables) {
        TaskResponse task = workflow.getTask(taskId);
        assertCanAct(user, task);
        Map<String, Object> input = variables == null ? Map.of() : variables;
        boolean approved = !"REJECTED".equals(String.valueOf(input.getOrDefault("decision", "APPROVED")));
        Map<String, Object> engineVars = new HashMap<>(input);
        engineVars.put("approved", approved);
        engineVars.put("decidedBy", user.id());
        if (!engineVars.containsKey("comment")) {
            engineVars.put("comment", null);
        }
        ProcessInstanceResponse instance = workflow.complete(taskId, new CompleteTaskRequest(user.id(), engineVars));
        String businessKey = task.businessKey();
        if (businessKey != null) {
            claims.findByLineId(businessKey).ifPresent(claim -> {
                claimService.applyInstance(claim, instance);
                claims.save(claim);
            });
            mandates.findByNumber(businessKey).ifPresent(mandate -> {
                mandateService.applyInstance(mandate, instance);
                mandates.save(mandate);
            });
        }
        if (businessKey != null) {
            TaskDecision decision = new TaskDecision();
            decision.setRequestId(businessKey);
            decision.setTaskId(taskId);
            decision.setTaskKey(task.taskDefinitionKey());
            decision.setTaskName(task.name());
            decision.setDecision(approved ? "APPROVED" : "REJECTED");
            decision.setComment(input.get("comment") == null ? "" : String.valueOf(input.get("comment")));
            decision.setActorId(user.id());
            decisions.save(decision);
        }
        activity.record(
                approved ? "TASK_APPROVED" : "TASK_REJECTED",
                task.name(),
                "Claim".equals(entityType(task)) ? "Claim" : "MandateRequest",
                businessKey == null ? taskId : businessKey,
                user.id(),
                "{}");
        return instance;
    }

    /** Every workflow task of a claim (open and completed) with the decision taken, if any. */
    public List<ClaimTaskView> claimTasks(String lineId) {
        Claim claim = claims.findByLineId(lineId).orElse(null);
        if (claim == null || claim.getWorkflowInstanceId() == null) {
            return List.of();
        }
        Map<String, TaskDecision> byTask = decisions.findByRequestIdOrderByCreatedOnAsc(lineId).stream()
                .collect(Collectors.toMap(TaskDecision::getTaskId, Function.identity(), (first, second) -> second));
        return workflow.listTaskHistory(claim.getWorkflowInstanceId()).stream()
                .map(item -> new ClaimTaskView(
                        item.taskId(),
                        item.name(),
                        item.taskDefinitionKey(),
                        item.status(),
                        item.assignee(),
                        userName(item.assignee()),
                        byTask.containsKey(item.taskId()) ? byTask.get(item.taskId()).getDecision() : null,
                        item.createdOn(),
                        item.completedOn()))
                .toList();
    }

    /** The approval decisions recorded against a claim, oldest first. */
    public List<ClaimDecisionView> claimDecisions(String lineId) {
        return decisions.findByRequestIdOrderByCreatedOnAsc(lineId).stream()
                .map(decision -> new ClaimDecisionView(
                        decision.getTaskId(),
                        decision.getTaskKey(),
                        decision.getTaskName(),
                        decision.getDecision(),
                        decision.getComment(),
                        decision.getActorId(),
                        userName(decision.getActorId()),
                        decision.getCreatedOn()))
                .toList();
    }

    private String userName(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }
        return users.findById(userId).map(AppUser::getName).orElse(null);
    }

    public TaskResponse claim(SessionUser user, String taskId) {
        TaskResponse task = workflow.getTask(taskId);
        assertCanAct(user, task);
        return workflow.claim(taskId, user.id());
    }

    private void assertCanAct(SessionUser user, TaskResponse task) {
        boolean assignee = task.assignee() != null && task.assignee().equals(user.id());
        boolean candidate = task.candidateGroups() != null
                && task.candidateGroups().stream().anyMatch(user.groups()::contains);
        boolean readAll = user.permissions().contains("claim:read:all");
        if (!assignee && !candidate && !readAll) {
            throw new AccessDeniedException("You are not allowed to act on this task");
        }
    }

    private String entityType(TaskResponse task) {
        if (task.businessKey() == null) {
            return "Claim";
        }
        return mandates.findByNumber(task.businessKey()).isPresent() ? "Mandate" : "Claim";
    }

    public Claim lookupClaim(String businessKey) {
        if (businessKey == null) {
            return null;
        }
        return claims.findByLineId(businessKey).orElse(null);
    }
}
