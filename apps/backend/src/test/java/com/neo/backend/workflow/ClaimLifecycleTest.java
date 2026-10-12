package com.aftermarket.backend.workflow;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
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

@SpringBootTest
class ClaimLifecycleTest {

    @Autowired
    private WorkflowFacade facade;

    @Autowired
    private TaskService taskService;

    private ProcessInstanceResponse startClaim(String businessKey, double totalAmount) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("requestId", businessKey);
        variables.put("businessKey", businessKey);
        variables.put("entityType", "CLAIM");
        variables.put("submittedBy", "employee1");
        variables.put("employeeGroup", "employees");
        variables.put("supervisorGroup", "supervisors");
        variables.put("financeGroup", "finance");
        variables.put("totalAmount", totalAmount);
        variables.put("hasDocuments", false);
        variables.put("managerReminderDuration", "PT4S");
        variables.put("managerEscalationDuration", "PT9S");
        return facade.start(new StartProcessRequest("claimLifecycle", businessKey, variables));
    }

    private Task singleTask(String processInstanceId) {
        Task task = taskService.createTaskQuery().processInstanceId(processInstanceId).singleResult();
        assertThat(task).isNotNull();
        return task;
    }

    private ProcessInstanceResponse approve(String taskId, String userId) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", true);
        variables.put("decision", "APPROVED");
        variables.put("comment", null);
        return facade.complete(taskId, new CompleteTaskRequest(userId, variables));
    }

    @Test
    void lowValueClaimCompletesWithoutFinance() {
        ProcessInstanceResponse started = startClaim("MCI-TEST-LOW", 500);
        assertThat(started.ended()).isFalse();
        assertThat(started.activeTaskKeys()).containsExactly("managerApproval");

        Task managerTask = singleTask(started.processInstanceId());
        assertThat(managerTask.getTaskDefinitionKey()).isEqualTo("managerApproval");

        ProcessInstanceResponse completed = approve(managerTask.getId(), "manager1");
        assertThat(completed.ended()).isTrue();
        assertThat(completed.variables().get("requiresFinance")).isEqualTo(false);
    }

    @Test
    void highValueClaimRoutesToFinanceThenRejects() {
        ProcessInstanceResponse started = startClaim("MCI-TEST-HIGH", 50000);
        assertThat(started.activeTaskKeys()).containsExactly("managerApproval");

        Task managerTask = singleTask(started.processInstanceId());
        ProcessInstanceResponse afterManager = approve(managerTask.getId(), "manager1");
        assertThat(afterManager.ended()).isFalse();
        assertThat(afterManager.activeTaskKeys()).containsExactly("financeApproval");
        assertThat(afterManager.variables().get("requiresFinance")).isEqualTo(true);

        Task financeTask = singleTask(started.processInstanceId());
        Map<String, Object> reject = new HashMap<>();
        reject.put("approved", false);
        reject.put("decision", "REJECTED");
        ProcessInstanceResponse rejected =
                facade.complete(financeTask.getId(), new CompleteTaskRequest("finance1", reject));
        assertThat(rejected.ended()).isTrue();
    }

    @Test
    void mandateApprovalCompletesThroughBothForums() {
        Map<String, Object> variables = new HashMap<>();
        variables.put("requestId", "64");
        variables.put("businessKey", "64");
        variables.put("entityType", "MANDATE");
        variables.put("submittedBy", "employee1");
        variables.put("employeeGroup", "employees");
        variables.put("supervisorGroup", "supervisors");
        variables.put("financeGroup", "finance");
        variables.put("managerReminderDuration", "PT4S");
        variables.put("managerEscalationDuration", "PT9S");
        ProcessInstanceResponse started = facade.start(new StartProcessRequest("mandateApproval", "64", variables));
        assertThat(started.ended()).isFalse();
        assertThat(started.activeTaskKeys()).containsExactly("clearingReview");

        Task clearing = singleTask(started.processInstanceId());
        ProcessInstanceResponse afterClearing = approve(clearing.getId(), "manager1");
        assertThat(afterClearing.activeTaskKeys()).containsExactly("doaApproval");

        Task doa = singleTask(started.processInstanceId());
        ProcessInstanceResponse completed = approve(doa.getId(), "finance1");
        assertThat(completed.ended()).isTrue();
    }
}
