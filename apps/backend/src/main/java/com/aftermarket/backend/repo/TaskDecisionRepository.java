package com.aftermarket.backend.repo;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.aftermarket.backend.domain.TaskDecision;

public interface TaskDecisionRepository extends JpaRepository<TaskDecision, String> {
    List<TaskDecision> findByRequestIdOrderByCreatedOnAsc(String requestId);

    List<TaskDecision> findByActorIdOrderByCreatedOnDesc(String actorId);

    List<TaskDecision> findByRequestIdInOrderByCreatedOnDesc(Collection<String> requestIds);
}
