package com.aftermarket.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "aftermarket")
public record AftermarketProperties(
        Jwt jwt,
        String storageDir) {

    public record Jwt(String secret, long expirySeconds) {
    }
}
