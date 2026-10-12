package com.aftermarket.backend.api;

import com.aftermarket.backend.domain.Document;
import com.aftermarket.backend.domain.Note;
import com.aftermarket.backend.repo.DocumentRepository;
import com.aftermarket.backend.repo.NoteRepository;
import com.aftermarket.backend.service.ActivityService;
import com.aftermarket.backend.service.ClaimService;
import com.aftermarket.backend.service.TaskAppService;
import com.aftermarket.backend.workflow.dto.ClaimDecisionView;
import com.aftermarket.backend.workflow.dto.ClaimTaskView;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/claims/{lineId}")
public class ClaimDetailController {

    private final ClaimService claims;
    private final NoteRepository notes;
    private final DocumentRepository documents;
    private final ActivityService activity;
    private final TaskAppService tasks;

    public ClaimDetailController(
            ClaimService claims,
            NoteRepository notes,
            DocumentRepository documents,
            ActivityService activity,
            TaskAppService tasks) {
        this.claims = claims;
        this.notes = notes;
        this.documents = documents;
        this.activity = activity;
        this.tasks = tasks;
    }

    @GetMapping("/audit")
    public List<ActivityService.ActivityView> audit(@PathVariable String lineId) {
        claims.get(lineId);
        return activity.forEntityWithActor(lineId);
    }

    @GetMapping("/tasks")
    public List<ClaimTaskView> tasks(@PathVariable String lineId) {
        claims.get(lineId);
        return tasks.claimTasks(lineId);
    }

    @GetMapping("/decisions")
    public List<ClaimDecisionView> decisions(@PathVariable String lineId) {
        claims.get(lineId);
        return tasks.claimDecisions(lineId);
    }

    @GetMapping("/notes")
    public List<Note> listNotes(@PathVariable String lineId) {
        claims.get(lineId);
        return notes.findByLineIdOrderByCreatedOnAsc(lineId);
    }

    @PostMapping("/notes")
    public Note addNote(
            Authentication authentication, @PathVariable String lineId, @RequestBody Map<String, String> body) {
        claims.get(lineId);
        Note note = new Note();
        note.setLineId(lineId);
        note.setNote(body.getOrDefault("note", ""));
        note.setAuthor(authentication == null ? "" : authentication.getName());
        note.setCreatedBy(authentication == null ? "" : authentication.getName());
        if (note.getNote() == null || note.getNote().isBlank() || note.getNote().length() > 1000) {
            throw new IllegalArgumentException("Note must be 1-1000 characters");
        }
        Note saved = notes.save(note);
        activity.record("NOTE_ADDED", "Note added", "Claim", lineId,
                authentication == null ? "" : authentication.getName(), "{}");
        return saved;
    }

    @GetMapping("/attachments")
    public List<Document> listAttachments(@PathVariable String lineId) {
        claims.get(lineId);
        return documents.findByLineIdOrderByCreatedOnAsc(lineId);
    }

    @PostMapping(value = "/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Document upload(
            Authentication authentication,
            @PathVariable String lineId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "fileType", defaultValue = "Other") String fileType,
            @RequestParam(value = "description", defaultValue = "") String description) {
        claims.get(lineId);
        if (file.getSize() > 25L * 1024 * 1024) {
            throw new IllegalArgumentException("File exceeds the 25 MB limit");
        }
        Document document = new Document();
        document.setLineId(lineId);
        document.setFileName(file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename());
        document.setFileType(fileType);
        document.setDescription(description);
        document.setStoragePath("memory:" + document.getFileName());
        document.setSizeBytes(file.getSize());
        document.setCreatedBy(authentication == null ? "" : authentication.getName());
        Document saved = documents.save(document);
        activity.record("ATTACHMENT_ADDED", saved.getFileName(), "Claim", lineId,
                authentication == null ? "" : authentication.getName(), "{}");
        return saved;
    }
}
