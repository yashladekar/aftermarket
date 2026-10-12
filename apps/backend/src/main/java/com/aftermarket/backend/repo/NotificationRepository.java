package com.aftermarket.backend.repo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.aftermarket.backend.domain.Notification;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedOnDesc(String userId);

    long countByUserIdAndReadFalse(String userId);

    List<Notification> findByRefIdAndTypeAndUserIdIn(String refId, String type, List<String> userIds);
}
