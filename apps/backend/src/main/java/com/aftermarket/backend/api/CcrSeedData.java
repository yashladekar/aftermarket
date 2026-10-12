package com.aftermarket.backend.api;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.aftermarket.backend.domain.AppUser;
import com.aftermarket.backend.domain.Ccr;
import com.aftermarket.backend.repo.AppUserRepository;
import com.aftermarket.backend.repo.CcrRepository;
import com.aftermarket.backend.service.CcrCatalogService;
import com.aftermarket.backend.service.CcrService;
import com.aftermarket.backend.service.IdentityService;
import com.aftermarket.backend.service.TaskAppService;
import com.aftermarket.backend.workflow.WorkflowFacade;
import com.aftermarket.backend.workflow.dto.TaskResponse;

@Service
public class CcrSeedData {

    private static final Logger log = LoggerFactory.getLogger(CcrSeedData.class);

    private static final int TOTAL = 200;

    private static final int SEED_VERSION = 2;

    private static final List<String> ON_BEHALF_REASONS = List.of(
            "Supplier Does Not Have Covisint Access",
            "Supplier Does Not Want To Use Appian",
            "Supplier Requires Onboarding",
            "Short Term Access Issue",
            "Escalation",
            "Other");

    private static final List<String> JUSTIFICATIONS = List.of(
            "Supplier advised a unit price uplift on %s from next month due to higher alloy surcharges; requesting validation so the forecast can be updated.",
            "Lead time extension requested for %s following capacity constraints at the %s plating line.",
            "MOQ alignment requested for %s to match the revised pack quantity; no price impact expected.",
            "Commercial terms update for %s: payment term alignment and cost breakdown refresh covering %s.",
            "Quality hold follow-up: containment actions agreed for %s; price protection requested during the investigation.",
            "Annual price review outcome for %s: settlement of commodity index movement agreed with %s.",
            "Logistics change: shift to consolidated shipments for %s; storage impact currently under review.",
            "Below-the-bar settlement proposal for %s covering historic volume variance with %s.");

    private static final List<String> FIRST_NAMES = List.of(
            "Alex", "Sam", "Jordan", "Taylor", "Casey", "Robin", "Jamie", "Avery");
    private static final List<String> LAST_NAMES = List.of(
            "Morgan", "Rivera", "Lee", "Brooks", "Patel", "Hughes", "Clarke", "Shaw");

    private final CcrRepository ccrs;
    private final CcrService ccrService;
    private final CcrCatalogService catalog;
    private final TaskAppService tasks;
    private final IdentityService identity;
    private final WorkflowFacade workflow;
    private final AppUserRepository users;
    private final JdbcTemplate jdbc;

    public CcrSeedData(
            CcrRepository ccrs,
            CcrService ccrService,
            CcrCatalogService catalog,
            TaskAppService tasks,
            IdentityService identity,
            WorkflowFacade workflow,
            AppUserRepository users,
            JdbcTemplate jdbc) {
        this.ccrs = ccrs;
        this.ccrService = ccrService;
        this.catalog = catalog;
        this.tasks = tasks;
        this.identity = identity;
        this.workflow = workflow;
        this.users = users;
        this.jdbc = jdbc;
    }

    public void seedIfEmpty() {
        if (isCurrentVersion()) {
            log.info("Skipping CCR seed: v{} seed already present", SEED_VERSION);
            return;
        }
        clearPreviousSeed();
        Random rng = new Random(7);
        String employeeId = userId("employee1@aftermarket.dev");
        String managerId = userId("manager1@aftermarket.dev");
        String financeId = userId("finance1@aftermarket.dev");

        List<Ccr> created = new ArrayList<>();
        for (int i = 0; i < TOTAL; i++) {
            Ccr ccr = ccrService.create(pickCreator(rng, employeeId, managerId), payload(rng, i));
            String group = groupFor(i);
            ccr.setSignoffLevel(signoffFor(group, rng));
            ccr.setRecentUpdate(updateFor(group, ccr, rng));
            ccr.setAtb(rng.nextDouble() < 0.20);
            ccr.setBb(rng.nextDouble() < 0.25);
            ccr.setSupplyOk(rng.nextDouble() < 0.85);
            ccr.setMissingRefData(switch (group) {
                case "DRAFT", "VALIDATION" -> rng.nextDouble() < 0.80;
                case "REVIEW" -> rng.nextDouble() < 0.30;
                default -> false;
            });
            if (!"DRAFT".equals(group) && !"VALIDATION".equals(group) && !"REVIEW".equals(group)) {
                ccr.setStatus(switch (group) {
                    case "MGR_LIVE" -> "Pending Approval";
                    case "FIN_LIVE" -> "Awaiting Finance";
                    case "APPROVED" -> "Approved";
                    default -> "Rejected";
                });
                ccr.setRecentUpdate(switch (group) {
                    case "MGR_LIVE" -> "Awaiting Manager Approval";
                    case "FIN_LIVE" -> "Awaiting Finance Approval";
                    case "APPROVED" -> "CCR Approved";
                    default -> "CCR Rejected";
                });
            } else {
                ccr.setStatus(switch (group) {
                    case "DRAFT" -> "Draft";
                    case "VALIDATION" -> "Pending Validation";
                    default -> "Awaiting Review";
                });
            }
            created.add(ccrs.save(ccr));
            if (i % 25 == 0) {
                log.info("CCR seed: created {}/{}", i, TOTAL);
            }
        }

        runWorkflows(created, employeeId, managerId, financeId);
        backdate(created, rng);
        jdbc.update("INSERT INTO mci_ccr_seed_version (version) VALUES (?)", SEED_VERSION);
        log.info("CCR seed complete: {} rows (v{})", created.size(), SEED_VERSION);
    }

    private boolean isCurrentVersion() {
        try {
            jdbc.execute(
                    "CREATE TABLE IF NOT EXISTS mci_ccr_seed_version (version INT PRIMARY KEY, seeded_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
            Integer version = jdbc.queryForObject("SELECT MAX(version) FROM mci_ccr_seed_version", Integer.class);
            if (version != null && version >= SEED_VERSION) {
                return true;
            }
        } catch (Exception e) {
            log.warn("Seed version check failed, reseeding: {}", e.getMessage());
        }
        return ccrs.count() >= TOTAL && !hasVersionTable();
    }

    private boolean hasVersionTable() {
        try {
            jdbc.queryForObject("SELECT COUNT(*) FROM mci_ccr_seed_version", Integer.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void clearPreviousSeed() {
        try {
            jdbc.execute("DELETE FROM mci_activity_log WHERE entity_type = 'Ccr'");
            jdbc.execute("DELETE FROM mci_notification WHERE ref_type = 'Ccr'");
            jdbc.execute("DELETE FROM mci_task_decisions WHERE request_id LIKE 'CCR-%'");
            jdbc.execute("DELETE FROM mci_ccr");
            jdbc.execute("DELETE FROM mci_ccr_seed_version");
        } catch (Exception e) {
            log.warn("Previous seed cleanup skipped: {}", e.getMessage());
        }
    }

    private void runWorkflows(List<Ccr> created, String employeeId, String managerId, String financeId) {
        IdentityService.SessionUser manager = identity.sessionFor(managerId);
        IdentityService.SessionUser finance = identity.sessionFor(financeId);
        int workflows = 0;
        for (int i = 0; i < created.size(); i++) {
            String group = groupFor(i);
            if ("DRAFT".equals(group) || "VALIDATION".equals(group) || "REVIEW".equals(group)) {
                continue;
            }
            Ccr ccr = created.get(i);
            ccrService.submit(employeeId, ccr.getReference());
            if ("MGR_LIVE".equals(group)) {
                workflows++;
                continue;
            }
            boolean managerApproves = !"REJECTED".equals(group) || !"REJECT_MGR".equals(rejectKind(i));
            tasks.complete(manager, openTask(ccr.getReference(), "supervisors"),
                    Map.of("decision", managerApproves ? "APPROVED" : "REJECTED"));
            if (!managerApproves || "FIN_LIVE".equals(group)) {
                workflows++;
                continue;
            }
            boolean financeApproves = !"REJECTED".equals(group);
            tasks.complete(finance, openTask(ccr.getReference(), "finance"),
                    Map.of("decision", financeApproves ? "APPROVED" : "REJECTED"));
            workflows++;
        }
        log.info("CCR seed: ran {} workflows through manager/finance steps", workflows);
    }

    private String openTask(String reference, String group) {
        Ccr ccr = ccrService.get(reference);
        List<TaskResponse> open = workflow.listTasks(null, group, ccr.getWorkflowInstanceId());
        if (open.isEmpty()) {
            throw new IllegalStateException("No open task for seeded CCR " + reference);
        }
        return open.get(0).taskId();
    }

    private void backdate(List<Ccr> created, Random rng) {
        Instant now = Instant.now();
        for (int i = 0; i < created.size(); i++) {
            int daysAgo = daysAgo(rng);
            Instant createdOn = now.minus(daysAgo, ChronoUnit.DAYS).minus(rng.nextInt(12), ChronoUnit.HOURS);
            Instant updatedOn = createdOn.plus(1 + rng.nextInt(72), ChronoUnit.HOURS);
            if (updatedOn.isAfter(now)) {
                updatedOn = now;
            }
            jdbc.update("UPDATE mci_ccr SET created_on = ?, updated_on = ? WHERE id = ?",
                    Timestamp.from(createdOn), Timestamp.from(updatedOn), created.get(i).getId());
        }
    }

    private String groupFor(int i) {
        if (i < 40) {
            return "DRAFT";
        }
        if (i < 80) {
            return "VALIDATION";
        }
        if (i < 110) {
            return "REVIEW";
        }
        if (i < 140) {
            return "MGR_LIVE";
        }
        if (i < 160) {
            return "FIN_LIVE";
        }
        if (i < 185) {
            return "APPROVED";
        }
        return "REJECTED";
    }

    private String rejectKind(int i) {
        return i % 2 == 0 ? "REJECT_MGR" : "REJECT_FIN";
    }

    private String signoffFor(String group, Random rng) {
        return switch (group) {
            case "REVIEW" -> rng.nextBoolean() ? "Level 1" : "Level 2";
            case "APPROVED", "REJECTED", "FIN_LIVE" -> rng.nextBoolean() ? "Level 2" : "Level 3";
            case "MGR_LIVE" -> rng.nextDouble() < 0.5 ? "--" : "Level 1";
            default -> "--";
        };
    }

    private String updateFor(String group, Ccr ccr, Random rng) {
        List<String> parts = ccr.getPartNumbers() == null || ccr.getPartNumbers().isBlank()
                ? List.of()
                : List.of(ccr.getPartNumbers().split(","));
        String part = parts.isEmpty() ? "the selected parts" : "Part " + parts.get(rng.nextInt(parts.size())).trim();
        return switch (group) {
            case "DRAFT" -> "CCR Created";
            case "VALIDATION" -> rng.nextBoolean() ? "CCR Created" : "Reference data updated for " + part;
            default -> List.of(
                    "Part price updated for " + part,
                    "MOQ updated for " + part,
                    "Lead time updated for " + part,
                    "Reference data updated for " + part).get(rng.nextInt(4));
        };
    }

    private String pickCreator(Random rng, String employeeId, String managerId) {
        double roll = rng.nextDouble();
        if (roll < 0.75) {
            return employeeId;
        }
        if (roll < 0.90) {
            return managerId;
        }
        return "seed";
    }

    private String userId(String email) {
        return users.findByEmail(email).map(AppUser::getId).orElse("seed");
    }

    private int daysAgo(Random rng) {
        double roll = rng.nextDouble();
        if (roll < 0.60) {
            return rng.nextInt(15);
        }
        if (roll < 0.85) {
            return 15 + rng.nextInt(31);
        }
        return 46 + rng.nextInt(75);
    }

    private Map<String, Object> payload(Random rng, int i) {
        List<CcrCatalogService.VendorOption> vendors = catalog.vendors();
        CcrCatalogService.VendorOption vendor = vendors.get(rng.nextInt(vendors.size()));
        List<Map<String, String>> vendorList = new ArrayList<>();
        vendorList.add(Map.of("code", vendor.code(), "name", vendor.name()));
        List<CcrCatalogService.VendorPart> pool = new ArrayList<>(catalog.parts(vendor.code(), null));
        if (rng.nextDouble() < 0.10 && pool.size() > 1) {
            CcrCatalogService.VendorOption second = vendors.get((vendors.indexOf(vendor) + 3) % vendors.size());
            vendorList.add(Map.of("code", second.code(), "name", second.name()));
            pool.addAll(catalog.parts(second.code(), null));
        }

        int partCount = 1 + rng.nextInt(Math.min(3, pool.size()));
        List<CcrCatalogService.VendorPart> chosen = new ArrayList<>();
        List<CcrCatalogService.VendorPart> shuffled = new ArrayList<>(pool);
        java.util.Collections.shuffle(shuffled, rng);
        for (int k = 0; k < partCount; k++) {
            chosen.add(shuffled.get(k));
        }

        List<Map<String, Object>> partRows = new ArrayList<>();
        boolean net = rng.nextDouble() < 0.55;
        boolean lead = !net && rng.nextDouble() < 0.5;
        boolean moq = !net && !lead && rng.nextDouble() < 0.6;
        if (!net && !lead && !moq) {
            net = true;
        }
        for (CcrCatalogService.VendorPart part : chosen) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("partNumber", part.partNumber());
            row.put("newNetPrice", net ? bumped(part.netPrice(), rng) : "");
            row.put("newPer", "");
            row.put("newMoq", moq ? String.valueOf(50 + rng.nextInt(150)) : "");
            row.put("newOrderMultiple", moq && rng.nextBoolean() ? String.valueOf(10 + rng.nextInt(40)) : "");
            row.put("newLeadTime", lead ? String.valueOf(14 + rng.nextInt(28)) : "");
            row.put("buyingType", "General");
            row.put("buyingTypeQty", "");
            row.put("startDate", Instant.now().plus(15 + rng.nextInt(75), ChronoUnit.DAYS).toString().substring(0, 10));
            partRows.add(row);
        }

        String firstPart = chosen.get(0).partNumber();
        String justification = String.format(
                JUSTIFICATIONS.get(rng.nextInt(JUSTIFICATIONS.size())), firstPart, vendor.name());

        List<Map<String, Object>> documents = new ArrayList<>();
        Map<String, Object> quote = new LinkedHashMap<>();
        quote.put("name", "Quote_" + vendor.code() + "_" + firstPart + ".xlsx");
        quote.put("fileType", "Quote");
        quote.put("vendorCode", vendor.code());
        quote.put("partNumbers", chosen.stream().map(CcrCatalogService.VendorPart::partNumber).toList());
        documents.add(quote);
        if (rng.nextDouble() < 0.5) {
            Map<String, Object> extra = new LinkedHashMap<>();
            extra.put("name", (rng.nextBoolean() ? "CostBreakdown_" : "Allocation_") + vendor.code() + ".xlsx");
            extra.put("fileType", rng.nextBoolean() ? "Cost Breakdown" : "Allocation");
            extra.put("vendorCode", vendor.code());
            extra.put("partNumbers", List.of(firstPart));
            documents.add(extra);
        }

        List<Map<String, Object>> stakeholders = new ArrayList<>();
        int holderCount = rng.nextInt(3);
        for (int h = 0; h < holderCount; h++) {
            String name = FIRST_NAMES.get(rng.nextInt(FIRST_NAMES.size())) + " "
                    + LAST_NAMES.get(rng.nextInt(LAST_NAMES.size()));
            Map<String, Object> holder = new LinkedHashMap<>();
            holder.put("contactType", rng.nextDouble() < 0.7 ? "External" : "Internal");
            holder.put("name", name);
            holder.put("email", name.toLowerCase().replace(' ', '.') + (100 + rng.nextInt(900)) + "@example-supplier.co.uk");
            holder.put("vendorCodes", List.of(vendor.code()));
            stakeholders.add(holder);
        }

        String ccrType = net ? "Price Change"
                : lead || moq ? "Logistics Change"
                        : List.of("Commercial Terms", "Quality Hold").get(rng.nextInt(2));
        if (i % 11 == 4) {
            ccrType = "Commercial Terms";
        } else if (i % 11 == 8) {
            ccrType = "Quality Hold";
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("reference", String.format("CCR-%s-%04d", vendor.code(), 2001 + i));
        payload.put("kind", rng.nextDouble() < 0.15 ? "alb" : "standard");
        payload.put("vendors", vendorList);
        payload.put("parts", chosen.stream().map(CcrCatalogService.VendorPart::partNumber).toList());
        payload.put("partRows", partRows);
        payload.put("justification", justification);
        payload.put("documents", documents);
        payload.put("stakeholders", stakeholders);
        payload.put("onBehalfReason", ON_BEHALF_REASONS.get(rng.nextInt(ON_BEHALF_REASONS.size())));
        payload.put("priority", List.of("High", "Medium", "Low").get(rng.nextInt(3)));
        payload.put("ccrType", ccrType);
        return payload;
    }

    private String bumped(String netPrice, Random rng) {
        try {
            double current = Double.parseDouble(netPrice);
            double bumped = current * (1 + (rng.nextDouble() * 0.12 + 0.02) * (rng.nextBoolean() ? 1 : -1));
            return String.format("%.4f", Math.max(0.01, bumped));
        } catch (NumberFormatException e) {
            return netPrice;
        }
    }
}
