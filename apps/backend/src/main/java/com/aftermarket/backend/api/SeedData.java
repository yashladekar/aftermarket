package com.aftermarket.backend.api;

import com.aftermarket.backend.domain.AppGroup;
import com.aftermarket.backend.domain.AppUser;
import com.aftermarket.backend.domain.ApprovalRule;
import com.aftermarket.backend.domain.Membership;
import com.aftermarket.backend.repo.AppGroupRepository;
import com.aftermarket.backend.repo.AppUserRepository;
import com.aftermarket.backend.repo.ApprovalRuleRepository;
import com.aftermarket.backend.repo.MembershipRepository;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class SeedData implements ApplicationRunner {

    private final AppGroupRepository groups;
    private final AppUserRepository users;
    private final MembershipRepository memberships;
    private final ApprovalRuleRepository rules;
    private final PasswordEncoder passwords;

    public SeedData(
            AppGroupRepository groups,
            AppUserRepository users,
            MembershipRepository memberships,
            ApprovalRuleRepository rules,
            PasswordEncoder passwords) {
        this.groups = groups;
        this.users = users;
        this.memberships = memberships;
        this.rules = rules;
        this.passwords = passwords;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Core groups – "supervisors" is the Aftermarket approval group referenced in BPMN candidateGroups
        ensureGroup("employees", "Employees", "claim:create,claim:read:own,task:complete:employee,ccr:submit");
        ensureGroup("supervisors", "Aftermarket Approvers", "claim:read:all,task:approve:aftermarket,approval:review,ccr:approve:aftermarket");
        ensureGroup("finance", "Finance Approvers", "claim:read:all,task:approve:finance,report:read,approval:decide,ccr:approve:finance");

        // Seed demo users
        // manager1 is the Aftermarket approver (supervisors group)
        ensureUser("employee1@aftermarket.dev", "Erin Employee", "ZZ0X", List.of("employees"));
        ensureUser("manager1@aftermarket.dev", "Morgan Manager", "ZZ1X", List.of("employees", "supervisors"));
        ensureUser("finance1@aftermarket.dev", "Frankie Finance", "ZZ2X", List.of("finance"));
        if (rules.count() == 0) {
            ApprovalRule rule = new ApprovalRule();
            rule.setName("Default finance threshold");
            rule.setForum("Local Clearing House");
            rule.setApprovalLimit(1000);
            rule.setProcurementTeam("supervisors");
            rule.setFinanceTeam("finance");
            rule.setCreatedBy("seed");
            rules.save(rule);
        }
    }

    private void ensureGroup(String key, String name, String permissions) {
        groups.findByKey(key).ifPresentOrElse(
                group -> {
                    group.setName(name);
                    group.setPermissions(permissions);
                    groups.save(group);
                },
                () -> {
                    AppGroup group = new AppGroup();
                    group.setKey(key);
                    group.setName(name);
                    group.setPermissions(permissions);
                    group.setCreatedBy("seed");
                    groups.save(group);
                });
    }

    private void ensureUser(String email, String name, String buyerCode, List<String> groupKeys) {
        AppUser user = users.findByEmail(email).orElseGet(() -> {
            AppUser created = new AppUser();
            created.setEmail(email);
            created.setCreatedBy("seed");
            return created;
        });
        user.setName(name);
        user.setBuyerCode(buyerCode);
        user.setPasswordHash(passwords.encode("password"));
        user.setActive(true);
        users.save(user);
        for (String key : groupKeys) {
            groups.findByKey(key).ifPresent(group -> {
                boolean exists = memberships.findByUserId(user.getId()).stream()
                        .anyMatch(link -> link.getGroupId().equals(group.getId()));
                if (!exists) {
                    Membership membership = new Membership();
                    membership.setUserId(user.getId());
                    membership.setGroupId(group.getId());
                    membership.setCreatedBy("seed");
                    memberships.save(membership);
                }
            });
        }
    }
}
