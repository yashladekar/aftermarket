package com.aftermarket.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "mci_approval_rule")
public class ApprovalRule extends BaseEntity {

    @Column(name = "name")
    private String name = "";

    @Column(name = "forum")
    private String forum = "Local Clearing House";

    @Column(name = "approval_limit")
    private double approvalLimit = 1000;

    @Column(name = "procurement_team")
    private String procurementTeam = "supervisors";

    @Column(name = "finance_team")
    private String financeTeam = "finance";

    @Column(name = "is_lump_sum")
    private Boolean lumpSum;

    @Column(name = "is_poa_increase")
    private Boolean poaIncrease;

    @Column(name = "is_active")
    private boolean active = true;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getForum() {
        return forum;
    }

    public void setForum(String forum) {
        this.forum = forum;
    }

    public double getApprovalLimit() {
        return approvalLimit;
    }

    public void setApprovalLimit(double approvalLimit) {
        this.approvalLimit = approvalLimit;
    }

    public String getProcurementTeam() {
        return procurementTeam;
    }

    public void setProcurementTeam(String procurementTeam) {
        this.procurementTeam = procurementTeam;
    }

    public String getFinanceTeam() {
        return financeTeam;
    }

    public void setFinanceTeam(String financeTeam) {
        this.financeTeam = financeTeam;
    }

    public Boolean getLumpSum() {
        return lumpSum;
    }

    public void setLumpSum(Boolean lumpSum) {
        this.lumpSum = lumpSum;
    }

    public Boolean getPoaIncrease() {
        return poaIncrease;
    }

    public void setPoaIncrease(Boolean poaIncrease) {
        this.poaIncrease = poaIncrease;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
