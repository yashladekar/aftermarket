package com.aftermarket.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "mci_note")
public class Note extends BaseEntity {

    @Column(name = "line_id", nullable = false)
    private String lineId;

    @Column(name = "note", length = 1000, nullable = false)
    private String note;

    @Column(name = "author")
    private String author = "";

    public String getLineId() {
        return lineId;
    }

    public void setLineId(String lineId) {
        this.lineId = lineId;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }
}
