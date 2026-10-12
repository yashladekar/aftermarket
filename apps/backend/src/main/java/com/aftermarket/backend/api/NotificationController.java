package com.aftermarket.backend.api;

import com.aftermarket.backend.domain.Notification;
import com.aftermarket.backend.service.IdentityService;
import com.aftermarket.backend.service.NotificationService;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notifications;
    private final IdentityService identity;

    public NotificationController(NotificationService notifications, IdentityService identity) {
        this.notifications = notifications;
        this.identity = identity;
    }

    @GetMapping
    public Map<String, Object> list(Authentication authentication) {
        IdentityService.SessionUser user = identity.sessionFor(authentication.getName());
        List<Notification> items = notifications.listForUser(user.id());
        return Map.of("items", items, "unread", notifications.unreadCount(user.id()));
    }

    @GetMapping("/unread-count")
    public Map<String, Object> unread(Authentication authentication) {
        IdentityService.SessionUser user = identity.sessionFor(authentication.getName());
        return Map.of("unread", notifications.unreadCount(user.id()));
    }

    @PostMapping("/read-all")
    public Map<String, Object> readAll(Authentication authentication) {
        IdentityService.SessionUser user = identity.sessionFor(authentication.getName());
        notifications.markAllRead(user.id());
        return Map.of("ok", true);
    }

    @PostMapping("/{id}/read")
    public Map<String, Object> read(Authentication authentication, @PathVariable String id) {
        IdentityService.SessionUser user = identity.sessionFor(authentication.getName());
        notifications.markRead(user.id(), id);
        return Map.of("ok", true);
    }
}
