package com.aftermarket.backend.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.aftermarket.backend.domain.AppGroup;
import com.aftermarket.backend.domain.AppUser;
import com.aftermarket.backend.domain.Membership;
import com.aftermarket.backend.repo.AppGroupRepository;
import com.aftermarket.backend.repo.AppUserRepository;
import com.aftermarket.backend.repo.MembershipRepository;

@Service
public class IdentityService {

    private final AppUserRepository users;
    private final AppGroupRepository groups;
    private final MembershipRepository memberships;

    public IdentityService(AppUserRepository users, AppGroupRepository groups, MembershipRepository memberships) {
        this.users = users;
        this.groups = groups;
        this.memberships = memberships;
    }

    public record SessionUser(String id, String email, String name, List<String> groups, List<String> permissions) {
    }

    public SessionUser sessionFor(String userId) {
        AppUser user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));
        List<Membership> links = memberships.findByUserId(userId);
        List<String> groupKeys = new ArrayList<>();
        List<String> permissions = new ArrayList<>();
        for (Membership link : links) {
            groups.findById(link.getGroupId()).map(AppGroup::getKey).ifPresent(groupKeys::add);
            groups.findById(link.getGroupId()).ifPresent(group -> {
                if (group.getPermissions() != null && !group.getPermissions().isBlank()) {
                    Arrays.stream(group.getPermissions().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .forEach(permissions::add);
                }
            });
        }
        return new SessionUser(user.getId(), user.getEmail(), user.getName(), groupKeys, permissions);
    }

    public SessionUser requireUser(String userId) {
        return sessionFor(userId);
    }

    public List<String> userIdsInGroups(List<String> groupKeys) {
        List<String> userIds = new ArrayList<>();
        for (String key : groupKeys) {
            groups.findByKey(key).ifPresent(group -> memberships.findByGroupId(group.getId())
                    .forEach(link -> userIds.add(link.getUserId())));
        }
        return userIds;
    }
}
