package com.aftermarket.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "mci_ccr")
public class Ccr extends BaseEntity {

    @Column(name = "reference", nullable = false, unique = true)
    private String reference;

    @Column(name = "kind")
    private String kind = "standard";

    @Column(name = "ccr_type")
    private String ccrType = "Price Change";

    @Column(name = "status")
    private String status = "Draft";

    @Column(name = "priority")
    private String priority = "Medium";

    @Column(name = "vendor_codes", length = 1000)
    private String vendorCodes = "";

    @Column(name = "vendor_names", length = 2000)
    private String vendorNames = "";

    @Column(name = "part_numbers", length = 2000)
    private String partNumbers = "";

    @Column(name = "justification", length = 2000)
    private String justification = "";

    @Column(name = "on_behalf_reason", length = 500)
    private String onBehalfReason = "";

    @Column(name = "signoff_level")
    private String signoffLevel = "--";

    @Column(name = "recent_update", length = 1000)
    private String recentUpdate = "CCR Created";

    @Column(name = "net_price_change")
    private boolean netPriceChange = false;

    @Column(name = "lead_time_change")
    private boolean leadTimeChange = false;

    @Column(name = "moq_change")
    private boolean moqChange = false;

    @Column(name = "atb")
    private boolean atb = false;

    @Column(name = "bb")
    private boolean bb = false;

    @Column(name = "supply_ok")
    private boolean supplyOk = true;

    @Column(name = "missing_ref_data")
    private boolean missingRefData = true;

    @Lob
    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload = "{}";

    @Column(name = "workflow_instance_id")
    private String workflowInstanceId;

    @Column(name = "workflow_state")
    private String workflowState;

    @Column(name = "current_task_key")
    private String currentTaskKey;

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getCcrType() {
        return ccrType;
    }

    public void setCcrType(String ccrType) {
        this.ccrType = ccrType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getVendorCodes() {
        return vendorCodes;
    }

    public void setVendorCodes(String vendorCodes) {
        this.vendorCodes = vendorCodes;
    }

    public String getVendorNames() {
        return vendorNames;
    }

    public void setVendorNames(String vendorNames) {
        this.vendorNames = vendorNames;
    }

    public String getPartNumbers() {
        return partNumbers;
    }

    public void setPartNumbers(String partNumbers) {
        this.partNumbers = partNumbers;
    }

    public String getJustification() {
        return justification;
    }

    public void setJustification(String justification) {
        this.justification = justification;
    }

    public String getOnBehalfReason() {
        return onBehalfReason;
    }

    public void setOnBehalfReason(String onBehalfReason) {
        this.onBehalfReason = onBehalfReason;
    }

    public String getSignoffLevel() {
        return signoffLevel;
    }

    public void setSignoffLevel(String signoffLevel) {
        this.signoffLevel = signoffLevel;
    }

    public String getRecentUpdate() {
        return recentUpdate;
    }

    public void setRecentUpdate(String recentUpdate) {
        this.recentUpdate = recentUpdate;
    }

    public boolean isNetPriceChange() {
        return netPriceChange;
    }

    public void setNetPriceChange(boolean netPriceChange) {
        this.netPriceChange = netPriceChange;
    }

    public boolean isLeadTimeChange() {
        return leadTimeChange;
    }

    public void setLeadTimeChange(boolean leadTimeChange) {
        this.leadTimeChange = leadTimeChange;
    }

    public boolean isMoqChange() {
        return moqChange;
    }

    public void setMoqChange(boolean moqChange) {
        this.moqChange = moqChange;
    }

    public boolean isAtb() {
        return atb;
    }

    public void setAtb(boolean atb) {
        this.atb = atb;
    }

    public boolean isBb() {
        return bb;
    }

    public void setBb(boolean bb) {
        this.bb = bb;
    }

    public boolean isSupplyOk() {
        return supplyOk;
    }

    public void setSupplyOk(boolean supplyOk) {
        this.supplyOk = supplyOk;
    }

    public boolean isMissingRefData() {
        return missingRefData;
    }

    public void setMissingRefData(boolean missingRefData) {
        this.missingRefData = missingRefData;
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
