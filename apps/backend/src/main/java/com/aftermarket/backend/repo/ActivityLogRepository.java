package com.aftermarket.backend.repo;

import com.aftermarket.backend.domain.ActivityLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, String> {
    List<ActivityLog> findByEntityIdOrderByCreatedOnDesc(String entityId);
}
