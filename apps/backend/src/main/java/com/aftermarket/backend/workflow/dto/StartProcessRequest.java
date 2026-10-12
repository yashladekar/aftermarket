package com.aftermarket.backend.workflow.dto;

import java.util.Map;

public record StartProcessRequest(
        String processDefinitionKey,
        String businessKey,
        Map<String, Object> variables) {
}
