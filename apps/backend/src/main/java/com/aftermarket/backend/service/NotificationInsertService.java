package com.aftermarket.backend.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.aftermarket.backend.domain.Notification;
import com.aftermarket.backend.repo.NotificationRepository;

/**
 * Inserts one notification in its own transaction. A duplicate dedupe key then only fails this
 * insert, not the workflow step that is emitting the notifications.
 */
@Service
public class NotificationInsertService {

    private final NotificationRepository notifications;

    public NotificationInsertService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean insert(Notification notification) {
        try {
            notifications.saveAndFlush(notification);
            return true;
        } catch (DataIntegrityViolationException duplicate) {
            return false;
        }
    }
}
