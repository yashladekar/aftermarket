package com.aftermarket.backend.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/** Pushes lightweight change signals to a user's open browser streams. */
@Service
public class UserEventService {

    private final Map<String, List<SseEmitter>> streams = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String userId) {
        SseEmitter emitter = new SseEmitter(0L);
        streams.computeIfAbsent(userId, key -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> detach(userId, emitter));
        emitter.onTimeout(() -> detach(userId, emitter));
        emitter.onError(error -> detach(userId, emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data(Map.of("userId", userId)));
        } catch (IOException e) {
            detach(userId, emitter);
        }
        return emitter;
    }

    /** Signals the user once the surrounding transaction commits, so reloads see the new rows. */
    public void publishAfterCommit(String userId, String type) {
        publishAfterCommit(userId, type, null);
    }

    /** Signals the user once the surrounding transaction commits; the reference lets the page refresh only that request. */
    public void publishAfterCommit(String userId, String type, String reference) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    push(userId, type, reference);
                }
            });
        } else {
            push(userId, type, reference);
        }
    }

    private void push(String userId, String type, String reference) {
        Map<String, Object> payload = reference == null
                ? Map.of("type", type)
                : Map.of("type", type, "reference", reference);
        for (SseEmitter emitter : streams.getOrDefault(userId, List.of())) {
            try {
                emitter.send(SseEmitter.event().name(type).data(payload));
            } catch (IOException e) {
                detach(userId, emitter);
            }
        }
    }

    private void detach(String userId, SseEmitter emitter) {
        streams.computeIfPresent(userId, (key, list) -> {
            list.remove(emitter);
            return list.isEmpty() ? null : list;
        });
    }
}
