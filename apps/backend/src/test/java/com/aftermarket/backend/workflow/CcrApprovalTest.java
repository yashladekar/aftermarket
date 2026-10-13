package com.aftermarket.backend.workflow;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.flowable.engine.TaskService;
import org.flowable.task.api.Task;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.aftermarket.backend.workflow.WorkflowFacade;
import com.aftermarket.backend.workflow.dto.CompleteTaskRequest;
import com.aftermarket.backend.workflow.dto.ProcessInstanceResponse;
import com.aftermarket.backend.workflow.dto.StartProcessRequest;

/**
 * Integration tests for the ccrApproval Flowable process.
 * Verifies the sequential Aftermarket → Finance approval workflow.
 */
@SpringBootTest
class CcrApprovalTest {

    @Autowired
    private WorkflowFacade facade;

    @Autowired
    private TaskService taskService;

    private static final String AFTERMARKET_GROUP = "supervisors";
    private static final String FINANCE_GROUP = "finance";

    private ProcessInstanceResponse startCcr(String businessKey) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("requestId", businessKey);
        variables.put("businessKey", businessKey);
        variables.put("entityType", "CCR");
        variables.put("submittedBy", "employee1");
        variables.put("aftermarketGroup", AFTERMARKET_GROUP);
        variables.put("financeGroup", FINANCE_GROUP);
        return facade.start(new StartProcessRequest("ccrApproval", businessKey, variables));
    }

    private Task singleTask(String processInstanceId) {
        Task task = taskService.createTaskQuery()
                .processInstanceId(processInstanceId)
                .singleResult();
        assertThat(task).as("Expected exactly one active task").isNotNull();
        return task;
    }

    private ProcessInstanceResponse completeWithDecision(String taskId, String userId, boolean approved) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", approved);
        variables.put("decidedBy", userId);
        return facade.complete(taskId, new CompleteTaskRequest(userId, variables));
    }

    // ------------------------------------------------------------------
    // Test 1: After submission, only Aftermarket task is active
    // ------------------------------------------------------------------
    @Test
    void afterSubmissionOnlyAftermarketTaskIsActive() {
        ProcessInstanceResponse started = startCcr("CCR-TEST-001");

        assertThat(started.ended()).isFalse();
        assertThat(started.activeTaskKeys()).containsExactly("aftermarketApproval");

        Task task = singleTask(started.processInstanceId());
        assertThat(task.getTaskDefinitionKey()).isEqualTo("aftermarketApproval");

        // Finance has no task yet
        List<Task> financeTasks = taskService.createTaskQuery()
                .processInstanceId(started.processInstanceId())
                .taskCandidateGroup(FINANCE_GROUP)
                .list();
        assertThat(financeTasks).isEmpty();
    }

    // ------------------------------------------------------------------
    // Test 2: Aftermarket approval activates Finance task
    // ------------------------------------------------------------------
    @Test
    void aftermarketApprovalActivatesFinanceTask() {
        ProcessInstanceResponse started = startCcr("CCR-TEST-002");
        Task aftermarketTask = singleTask(started.processInstanceId());
        assertThat(aftermarketTask.getTaskDefinitionKey()).isEqualTo("aftermarketApproval");

        // Aftermarket approves
        ProcessInstanceResponse afterApproval = completeWithDecision(aftermarketTask.getId(), "manager1", true);
        assertThat(afterApproval.ended()).isFalse();
        assertThat(afterApproval.activeTaskKeys()).containsExactly("financeApproval");

        // Finance now has a task
        Task financeTask = singleTask(started.processInstanceId());
        assertThat(financeTask.getTaskDefinitionKey()).isEqualTo("financeApproval");
    }

    // ------------------------------------------------------------------
    // Test 3: Aftermarket rejection ends the process (no Finance task)
    // ------------------------------------------------------------------
    @Test
    void aftermarketRejectionEndsProcessWithoutFinance() {
        ProcessInstanceResponse started = startCcr("CCR-TEST-003");
        Task aftermarketTask = singleTask(started.processInstanceId());

        ProcessInstanceResponse afterRejection = completeWithDecision(aftermarketTask.getId(), "manager1", false);
        assertThat(afterRejection.ended()).isTrue();

        // No active tasks remain
        List<Task> remaining = taskService.createTaskQuery()
                .processInstanceId(started.processInstanceId())
                .list();
        assertThat(remaining).isEmpty();
    }

    // ------------------------------------------------------------------
    // Test 4: Finance approval completes the process
    // ------------------------------------------------------------------
    @Test
    void financeApprovalCompletesProcess() {
        ProcessInstanceResponse started = startCcr("CCR-TEST-004");
        Task aftermarketTask = singleTask(started.processInstanceId());
        completeWithDecision(aftermarketTask.getId(), "manager1", true);

        Task financeTask = singleTask(started.processInstanceId());
        assertThat(financeTask.getTaskDefinitionKey()).isEqualTo("financeApproval");

        ProcessInstanceResponse completed = completeWithDecision(financeTask.getId(), "finance1", true);
        assertThat(completed.ended()).isTrue();
    }

    // ------------------------------------------------------------------
    // Test 5: Finance rejection ends the process as rejected
    // ------------------------------------------------------------------
    @Test
    void financeRejectionEndsProcessAsRejected() {
        ProcessInstanceResponse started = startCcr("CCR-TEST-005");
        Task aftermarketTask = singleTask(started.processInstanceId());
        completeWithDecision(aftermarketTask.getId(), "manager1", true);

        Task financeTask = singleTask(started.processInstanceId());
        ProcessInstanceResponse rejected = completeWithDecision(financeTask.getId(), "finance1", false);
        assertThat(rejected.ended()).isTrue();
    }

    // ------------------------------------------------------------------
    // Test 6: Aftermarket task has correct candidate group
    // ------------------------------------------------------------------
    @Test
    void aftermarketTaskHasCorrectCandidateGroup() {
        ProcessInstanceResponse started = startCcr("CCR-TEST-006");

        List<Task> supervisorTasks = taskService.createTaskQuery()
                .processInstanceId(started.processInstanceId())
                .taskCandidateGroup(AFTERMARKET_GROUP)
                .list();
        assertThat(supervisorTasks).hasSize(1);
        assertThat(supervisorTasks.get(0).getTaskDefinitionKey()).isEqualTo("aftermarketApproval");
    }
}

