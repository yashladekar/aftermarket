package com.aftermarket.backend.repo;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

import com.aftermarket.backend.domain.AppUser;

public interface AppUserRepository extends JpaRepository<AppUser, String> {
    Optional<AppUser> findByEmail(String email);
}
