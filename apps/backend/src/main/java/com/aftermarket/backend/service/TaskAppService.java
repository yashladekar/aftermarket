package com.aftermarket.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aftermarket.backend.domain.TaskDecision;
import com.aftermarket.backend.repo.CcrRepository;
import com.aftermarket.backend.repo.TaskDecisionRepository;
import com.aftermarket.backend.service.IdentityService.SessionUser;
import com.aftermarket.backend.workflow.WorkflowFacade;
import com.aftermarket.backend.workflow.dto.CompleteTaskRequest;
import com.aftermarket.backend.workflow.dto.ProcessInstanceResponse;
import com.aftermarket.backend.workflow.dto.TaskResponse;

@Service
public class TaskAppService {

    private final WorkflowFacade workflow;
    private final CcrRepository ccrs;
    private final TaskDecisionRepository decisions;
    private final CcrService ccrService;
    private final ActivityService activity;

    public TaskAppService(
            WorkflowFacade workflow,
            CcrRepository ccrs,
            TaskDecisionRepository decisions,
            CcrService ccrService,
            ActivityService activity) {
        this.workflow = workflow;
        this.ccrs = ccrs;
        this.decisions = decisions;
        this.ccrService = ccrService;
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

    @Transactional
    public ProcessInstanceResponse complete(SessionUser user, String taskId, Map<String, Object> variables) {
        TaskResponse task = workflow.getTask(taskId);
        assertCanAct(user, task);
        Map<String, Object> input = variables == null ? Map.of() : variables;
        boolean approved = !"REJECTED".equals(String.valueOf(input.getOrDefault("decision", "APPROVED")));
        Map<String, Object> engineVars = new HashMap<>(input);
        engineVars.put("approved", approved);
        engineVars.put("decidedBy", user.id());
        if ("managerApproval".equals(task.taskDefinitionKey())) {
            engineVars.put("managerId", user.id());
        }
        if (!engineVars.containsKey("comment")) {
            engineVars.put("comment", null);
        }
        ProcessInstanceResponse instance = workflow.complete(taskId, new CompleteTaskRequest(user.id(), engineVars));
        String businessKey = task.businessKey();
        if (businessKey != null) {
            ccrs.findByReference(businessKey).ifPresent(ccr -> {
                ccrService.applyInstance(ccr, instance);
                ccrs.save(ccr);
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
                "Ccr",
                businessKey == null ? taskId : businessKey,
                user.id(),
                "{}");
        if (businessKey != null) {
            ccrService.publishToStakeholders(businessKey, user.id());
        }
        return instance;
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
        boolean readAll = user.permissions().contains("ccr:read:all");
        if (!assignee && !candidate && !readAll) {
            throw new AccessDeniedException("You are not allowed to act on this task");
        }
    }
}
