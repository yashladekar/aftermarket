package com.aftermarket.backend.api;

import com.aftermarket.backend.service.IdentityService;
import com.aftermarket.backend.service.UserEventService;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final UserEventService events;
    private final IdentityService identity;

    public EventController(UserEventService events, IdentityService identity) {
        this.events = events;
        this.identity = identity;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(Authentication authentication) {
        return events.subscribe(identity.sessionFor(authentication.getName()).id());
    }
}
