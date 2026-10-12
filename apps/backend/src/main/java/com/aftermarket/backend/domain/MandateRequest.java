package com.aftermarket.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "mci_request")
public class MandateRequest extends BaseEntity {

    @Column(name = "request_number", nullable = false, unique = true)
    private String number;

    @Column(name = "request_type")
    private String requestType = "Mandate";

    @Column(name = "category")
    private String category = "Prompt Payment";

    @Column(name = "forum")
    private String level = "Local Clearing House";

    @Column(name = "overall_status")
    private String overall = "Draft Mandate Request";

    @Column(name = "clearing_status")
    private String clearing = "";

    @Column(name = "doa_status")
    private String doa = "Draft";

    @Column(name = "claim_ids", length = 2000)
    private String claimIds = "";

    @Column(name = "vendor_code")
    private String vendorCode = "";

    @Column(name = "vendor_name")
    private String vendorName = "";

    @Column(name = "coc")
    private String coc = "ZZ COC Test";

    @Column(name = "raiser")
    private String raiser = "Buyer Officer";

    @Column(name = "stakeholders")
    private String stakeholders = "";

    @Lob
    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload = "{}";

    @Column(name = "workflow_instance_id")
    private String workflowInstanceId;

    @Column(name = "workflow_state")
    private String workflowState;

    @Column(name = "current_task_key")
    private String currentTaskKey;

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getOverall() {
        return overall;
    }

    public void setOverall(String overall) {
        this.overall = overall;
    }

    public String getClearing() {
        return clearing;
    }

    public void setClearing(String clearing) {
        this.clearing = clearing;
    }

    public String getDoa() {
        return doa;
    }

    public void setDoa(String doa) {
        this.doa = doa;
    }

    public String getClaimIds() {
        return claimIds;
    }

    public void setClaimIds(String claimIds) {
        this.claimIds = claimIds;
    }

    public String getVendorCode() {
        return vendorCode;
    }

    public void setVendorCode(String vendorCode) {
        this.vendorCode = vendorCode;
    }

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String vendorName) {
        this.vendorName = vendorName;
    }

    public String getCoc() {
        return coc;
    }

    public void setCoc(String coc) {
        this.coc = coc;
    }

    public String getRaiser() {
        return raiser;
    }

    public void setRaiser(String raiser) {
        this.raiser = raiser;
    }

    public String getStakeholders() {
        return stakeholders;
    }

    public void setStakeholders(String stakeholders) {
        this.stakeholders = stakeholders;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public String getWorkflowInstanceId() {
        return workflowInstanceId;
    }

    public void setWorkflowInstanceId(String workflowInstanceId) {
        this.workflowInstanceId = workflowInstanceId;
    }

    public String getWorkflowState() {
        return workflowState;
    }

    public void setWorkflowState(String workflowState) {
        this.workflowState = workflowState;
    }

    public String getCurrentTaskKey() {
        return currentTaskKey;
    }

    public void setCurrentTaskKey(String currentTaskKey) {
        this.currentTaskKey = currentTaskKey;
    }
}
