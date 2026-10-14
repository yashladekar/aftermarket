package com.aftermarket.backend.api;

import com.aftermarket.backend.service.IdentityService;
import com.aftermarket.backend.service.TaskAppService;
import com.aftermarket.backend.workflow.dto.ProcessInstanceResponse;
import com.aftermarket.backend.workflow.dto.TaskResponse;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskAppService tasks;
    private final IdentityService identity;

    public TaskController(TaskAppService tasks, IdentityService identity) {
        this.tasks = tasks;
        this.identity = identity;
    }

    @GetMapping
    public List<TaskResponse> list(Authentication authentication) {
        return tasks.listForUser(identity.sessionFor(authentication.getName()));
    }

    @GetMapping("/{taskId}")
    public TaskResponse get(Authentication authentication, @PathVariable String taskId) {
        return tasks.getForUser(identity.sessionFor(authentication.getName()), taskId);
    }

    @PostMapping("/{taskId}/complete")
    public ProcessInstanceResponse complete(
            Authentication authentication,
            @PathVariable String taskId,
            @RequestBody(required = false) Map<String, Object> variables) {
        return tasks.complete(
                identity.sessionFor(authentication.getName()), taskId, variables == null ? Map.of() : variables);
    }

    @PostMapping("/{taskId}/claim")
    public TaskResponse claim(
            Authentication authentication,
            @PathVariable String taskId) {
        IdentityService.SessionUser user = identity.sessionFor(authentication.getName());
        return tasks.claim(user, taskId);
    }
}
