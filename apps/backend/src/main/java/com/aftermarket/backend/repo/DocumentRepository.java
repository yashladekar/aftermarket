package com.aftermarket.backend.repo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.aftermarket.backend.domain.Document;

public interface DocumentRepository extends JpaRepository<Document, String> {
    List<Document> findByLineIdOrderByCreatedOnAsc(String lineId);
}
