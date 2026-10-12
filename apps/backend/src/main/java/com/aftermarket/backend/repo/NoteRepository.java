package com.aftermarket.backend.repo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.aftermarket.backend.domain.Note;

public interface NoteRepository extends JpaRepository<Note, String> {
    List<Note> findByLineIdOrderByCreatedOnAsc(String lineId);
}
