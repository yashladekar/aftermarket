package com.aftermarket.backend.api;

import com.aftermarket.backend.domain.AppUser;
import com.aftermarket.backend.repo.AppUserRepository;
import com.aftermarket.backend.security.JwtService;
import com.aftermarket.backend.service.ActivityService;
import com.aftermarket.backend.service.IdentityService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppUserRepository users;
    private final PasswordEncoder passwords;
    private final JwtService jwt;
    private final IdentityService identity;
    private final ActivityService activity;

    public AuthController(
            AppUserRepository users,
            PasswordEncoder passwords,
            JwtService jwt,
            IdentityService identity,
            ActivityService activity) {
        this.users = users;
        this.passwords = passwords;
        this.jwt = jwt;
        this.identity = identity;
        this.activity = activity;
    }

    public record LoginRequest(String email, String password) {
    }

    public record UserDto(String id, String email, String name, List<String> groups, List<String> permissions) {
    }

    public record LoginResponse(String token, UserDto user) {
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        AppUser user = users.findByEmail(request.email())
                .filter(AppUser::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!passwords.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        IdentityService.SessionUser session = identity.sessionFor(user.getId());
        String token = jwt.createToken(user.getId(), user.getEmail(), session.groups());
        activity.record("LOGIN", user.getEmail(), "AppUser", user.getId(), user.getId(), "{}");
        return new LoginResponse(token, toDto(session));
    }

    @PostMapping("/logout")
    public void logout(Authentication authentication) {
        if (authentication != null) {
            activity.record("LOGOUT", "logout", "AppUser", authentication.getName(), authentication.getName(), "{}");
        }
    }

    @GetMapping("/me")
    public UserDto me(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return toDto(identity.sessionFor(authentication.getName()));
    }

    private UserDto toDto(IdentityService.SessionUser session) {
        return new UserDto(session.id(), session.email(), session.name(), session.groups(), session.permissions());
    }
}
