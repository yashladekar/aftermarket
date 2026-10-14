package com.aftermarket.backend.repo;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aftermarket.backend.domain.Notification;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedOnDesc(String userId);

    Page<Notification> findByUserIdOrderByCreatedOnDesc(String userId, Pageable pageable);

    long countByUserIdAndReadFalse(String userId);

    boolean existsByDedupeKey(String dedupeKey);

    @Modifying
    @Query("update Notification n set n.read = true where n.userId = :userId and n.read = false")
    int markAllRead(@Param("userId") String userId);
}
