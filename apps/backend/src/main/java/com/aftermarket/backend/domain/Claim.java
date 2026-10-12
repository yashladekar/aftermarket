package com.aftermarket.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "mci_risk_opportunity")
public class Claim extends BaseEntity {

    @Column(name = "reference_number", nullable = false, unique = true)
    private String lineId;

    @Column(name = "risk_opportunity_parent_id")
    private String parentId = "";

    @Column(name = "supplier_claim_type")
    private String supplierClaimType = "";

    @Column(name = "transaction_type")
    private String transactionType = "";

    @Column(name = "fiscal_year")
    private String fiscalYear = "2024-2025";

    @Column(name = "coc")
    private String coc = "ZZ COC Test";

    @Column(name = "confidential")
    private boolean confidential = false;

    @Column(name = "vendor_name")
    private String vendorName = "";

    @Column(name = "vendor_code")
    private String vendorCode = "";

    @Column(name = "description", length = 2000)
    private String description = "";

    @Column(name = "value_gbp")
    private String reportingValue = "0.0000";

    @Column(name = "is_negative")
    private boolean reportingNegative = false;

    @Column(name = "workflow_status")
    private String status = "Draft";

    @Column(name = "implementation_date")
    private String implementationDate = "";

    @Column(name = "is_reserve")
    private boolean reserve = false;

    @Column(name = "buyer_code")
    private String buyerCode = "ZZ0X";

    @Column(name = "buyer_name")
    private String buyerName = "Buyer Officer";

    @Column(name = "pm_code")
    private String pmCode = "ZZ1X";

    @Column(name = "pm_name")
    private String pmName = "Purchasing Manager";

    @Lob
    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload = "{}";

    @Column(name = "workflow_instance_id")
    private String workflowInstanceId;

    @Column(name = "workflow_state")
    private String workflowState;

    @Column(name = "current_task_key")
    private String currentTaskKey;

    public String getLineId() {
        return lineId;
    }

    public void setLineId(String lineId) {
        this.lineId = lineId;
    }

    public String getParentId() {
        return parentId;
    }

    public void setParentId(String parentId) {
        this.parentId = parentId;
    }

    public String getSupplierClaimType() {
        return supplierClaimType;
    }

    public void setSupplierClaimType(String supplierClaimType) {
        this.supplierClaimType = supplierClaimType;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public String getFiscalYear() {
        return fiscalYear;
    }

    public void setFiscalYear(String fiscalYear) {
        this.fiscalYear = fiscalYear;
    }

    public String getCoc() {
        return coc;
    }

    public void setCoc(String coc) {
        this.coc = coc;
    }

    public boolean isConfidential() {
        return confidential;
    }

    public void setConfidential(boolean confidential) {
        this.confidential = confidential;
    }

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String vendorName) {
        this.vendorName = vendorName;
    }

    public String getVendorCode() {
        return vendorCode;
    }

    public void setVendorCode(String vendorCode) {
        this.vendorCode = vendorCode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReportingValue() {
        return reportingValue;
    }

    public void setReportingValue(String reportingValue) {
        this.reportingValue = reportingValue;
    }

    public boolean isReportingNegative() {
        return reportingNegative;
    }

    public void setReportingNegative(boolean reportingNegative) {
        this.reportingNegative = reportingNegative;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getImplementationDate() {
        return implementationDate;
    }

    public void setImplementationDate(String implementationDate) {
        this.implementationDate = implementationDate;
    }

    public boolean isReserve() {
        return reserve;
    }

    public void setReserve(boolean reserve) {
        this.reserve = reserve;
    }

    public String getBuyerCode() {
        return buyerCode;
    }

    public void setBuyerCode(String buyerCode) {
        this.buyerCode = buyerCode;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getPmCode() {
        return pmCode;
    }

    public void setPmCode(String pmCode) {
        this.pmCode = pmCode;
    }

    public String getPmName() {
        return pmName;
    }

    public void setPmName(String pmName) {
        this.pmName = pmName;
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
