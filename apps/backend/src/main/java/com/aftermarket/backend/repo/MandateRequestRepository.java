package com.aftermarket.backend.repo;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

import com.aftermarket.backend.domain.MandateRequest;

public interface MandateRequestRepository extends JpaRepository<MandateRequest, String> {
    Optional<MandateRequest> findByNumber(String number);

    List<MandateRequest> findAllByOrderByCreatedOnDesc();

    List<MandateRequest> findByWorkflowInstanceIdIsNotNull();

    List<MandateRequest> findByCreatedByOrderByCreatedOnDesc(String createdBy);
}
