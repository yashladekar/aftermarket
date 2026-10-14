package com.aftermarket.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** One approval decision taken on a workflow task. */
@Entity
@Table(name = "mci_task_decisions")
public class TaskDecision extends BaseEntity {

    @Column(name = "request_id")
    private String requestId = "";

    @Column(name = "task_id")
    private String taskId = "";

    @Column(name = "task_key")
    private String taskKey = "";

    @Column(name = "task_name")
    private String taskName = "";

    @Column(name = "decision")
    private String decision = "";

    @Column(name = "comment", length = 2000)
    private String comment = "";

    @Column(name = "actor_id")
    private String actorId = "";

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public String getTaskKey() {
        return taskKey;
    }

    public void setTaskKey(String taskKey) {
        this.taskKey = taskKey;
    }

    public String getTaskName() {
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getActorId() {
        return actorId;
    }

    public void setActorId(String actorId) {
        this.actorId = actorId;
    }
}
