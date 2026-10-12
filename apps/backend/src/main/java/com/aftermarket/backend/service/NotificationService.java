package com.aftermarket.backend.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aftermarket.backend.domain.Notification;
import com.aftermarket.backend.repo.NotificationRepository;

@Service
public class NotificationService {

    private final NotificationRepository notifications;
    private final IdentityService identity;

    public NotificationService(NotificationRepository notifications, IdentityService identity) {
        this.notifications = notifications;
        this.identity = identity;
    }

    @Transactional
    public void notify(String type, String title, String body, String refType, String refId,
            List<String> userIds, List<String> groupKeys) {
        Set<String> recipients = new HashSet<>(userIds == null ? List.of() : userIds);
        if (groupKeys != null && !groupKeys.isEmpty()) {
            recipients.addAll(identity.userIdsInGroups(groupKeys));
        }
        if (recipients.isEmpty()) {
            return;
        }
        List<String> ids = new ArrayList<>(recipients);
        Set<String> already = new HashSet<>();
        notifications.findByRefIdAndTypeAndUserIdIn(refId, type, ids)
                .forEach(n -> already.add(n.getUserId()));
        List<Notification> fresh = new ArrayList<>();
        for (String userId : ids) {
            if (already.contains(userId)) {
                continue;
            }
            Notification notification = new Notification();
            notification.setUserId(userId);
            notification.setType(type);
            notification.setTitle(title);
            notification.setBody(body == null ? "" : body);
            notification.setRefType(refType);
            notification.setRefId(refId);
            fresh.add(notification);
        }
        if (!fresh.isEmpty()) {
            notifications.saveAll(fresh);
        }
    }

    public List<Notification> listForUser(String userId) {
        List<Notification> all = notifications.findByUserIdOrderByCreatedOnDesc(userId);
        return all.size() > 50 ? all.subList(0, 50) : all;
    }

    public long unreadCount(String userId) {
        return notifications.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(String userId, String id) {
        notifications.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setRead(true);
                notifications.save(n);
            }
        });
    }

    @Transactional
    public void markAllRead(String userId) {
        notifications.findByUserIdOrderByCreatedOnDesc(userId).stream()
                .filter(n -> !n.isRead())
                .forEach(n -> n.setRead(true));
    }
}
