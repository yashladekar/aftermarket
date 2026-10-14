package com.aftermarket.backend.workflow;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;
import org.flowable.engine.TaskService;
import org.flowable.task.api.Task;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.aftermarket.backend.workflow.dto.CompleteTaskRequest;
import com.aftermarket.backend.workflow.dto.ProcessInstanceResponse;
import com.aftermarket.backend.workflow.dto.StartProcessRequest;

@SpringBootTest
class CcrApprovalTest {

    @Autowired
    private WorkflowFacade facade;

    @Autowired
    private TaskService taskService;

    private ProcessInstanceResponse startCcr(String businessKey) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("requestId", businessKey);
        variables.put("businessKey", businessKey);
        variables.put("entityType", "CCR");
        variables.put("submittedBy", "employee1");
        variables.put("employeeGroup", "employees");
        variables.put("supervisorGroup", "supervisors");
        variables.put("financeGroup", "finance");
        variables.put("managerReminderDuration", "PT4S");
        variables.put("managerEscalationDuration", "PT9S");
        return facade.start(new StartProcessRequest("ccrApproval", businessKey, variables));
    }

    private Task singleTask(String processInstanceId) {
        Task task = taskService.createTaskQuery().processInstanceId(processInstanceId).singleResult();
        assertThat(task).isNotNull();
        return task;
    }

    private ProcessInstanceResponse decide(String taskId, String userId, boolean approved) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", approved);
        variables.put("decision", approved ? "APPROVED" : "REJECTED");
        variables.put("comment", null);
        return facade.complete(taskId, new CompleteTaskRequest(userId, variables));
    }

    @Test
    void submittedCcrRoutesManagerThenFinance() {
        ProcessInstanceResponse started = startCcr("CCR-TEST-0001");
        assertThat(started.ended()).isFalse();
        assertThat(started.activeTaskKeys()).containsExactly("managerApproval");

        Task managerTask = singleTask(started.processInstanceId());
        assertThat(managerTask.getTaskDefinitionKey()).isEqualTo("managerApproval");

        ProcessInstanceResponse afterManager = decide(managerTask.getId(), "manager1", true);
        assertThat(afterManager.ended()).isFalse();
        assertThat(afterManager.activeTaskKeys()).containsExactly("financeApproval");

        Task financeTask = singleTask(started.processInstanceId());
        assertThat(financeTask.getTaskDefinitionKey()).isEqualTo("financeApproval");

        ProcessInstanceResponse completed = decide(financeTask.getId(), "finance1", true);
        assertThat(completed.ended()).isTrue();
        assertThat(completed.variables().get("approved")).isEqualTo(true);
    }

    @Test
    void managerRejectionSkipsFinanceAndEnds() {
        ProcessInstanceResponse started = startCcr("CCR-TEST-0002");
        assertThat(started.activeTaskKeys()).containsExactly("managerApproval");

        Task managerTask = singleTask(started.processInstanceId());
        ProcessInstanceResponse rejected = decide(managerTask.getId(), "manager1", false);
        assertThat(rejected.ended()).isTrue();
        assertThat(rejected.variables().get("approved")).isEqualTo(false);
    }
}
