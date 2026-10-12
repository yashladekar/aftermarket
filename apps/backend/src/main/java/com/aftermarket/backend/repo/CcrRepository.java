package com.aftermarket.backend.repo;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

import com.aftermarket.backend.domain.Ccr;

public interface CcrRepository extends JpaRepository<Ccr, String> {
    Optional<Ccr> findByReference(String reference);

    List<Ccr> findAllByOrderByCreatedOnDesc();

    List<Ccr> findByWorkflowInstanceIdIsNotNull();

    List<Ccr> findByCreatedByOrderByCreatedOnDesc(String createdBy);
}
