package com.aftermarket.backend.repo;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

import com.aftermarket.backend.domain.Claim;

public interface ClaimRepository extends JpaRepository<Claim, String> {
    Optional<Claim> findByLineId(String lineId);

    List<Claim> findAllByOrderByCreatedOnDesc();

    List<Claim> findByWorkflowInstanceIdIsNotNull();

    List<Claim> findByCreatedByOrderByCreatedOnDesc(String createdBy);
}
