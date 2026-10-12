package com.aftermarket.backend.repo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.aftermarket.backend.domain.ApprovalRule;

public interface ApprovalRuleRepository extends JpaRepository<ApprovalRule, String> {
    List<ApprovalRule> findByActiveTrueOrderByApprovalLimitAsc();
}
