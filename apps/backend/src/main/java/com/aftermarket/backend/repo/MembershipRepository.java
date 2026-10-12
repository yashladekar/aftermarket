package com.aftermarket.backend.repo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.aftermarket.backend.domain.Membership;

public interface MembershipRepository extends JpaRepository<Membership, String> {
    List<Membership> findByUserId(String userId);

    List<Membership> findByGroupId(String groupId);
}
