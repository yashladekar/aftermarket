package com.aftermarket.backend.repo;

import com.aftermarket.backend.domain.AppGroup;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppGroupRepository extends JpaRepository<AppGroup, String> {
    Optional<AppGroup> findByKey(String key);
}
