package com.aftermarket.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "mci_document")
public class Document extends BaseEntity {

    @Column(name = "line_id")
    private String lineId = "";

    @Column(name = "file_name")
    private String fileName = "";

    @Column(name = "file_type")
    private String fileType = "";

    @Column(name = "description", length = 2000)
    private String description = "";

    @Column(name = "storage_path", length = 1000)
    private String storagePath = "";

    @Column(name = "size_bytes")
    private long sizeBytes;

    public String getLineId() {
        return lineId;
    }

    public void setLineId(String lineId) {
        this.lineId = lineId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }
}
