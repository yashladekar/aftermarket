package com.aftermarket.backend.api;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lookups")
public class LookupController {

    private static final Map<String, List<String>> LOOKUPS = Map.ofEntries(
            Map.entry("buyerCodes", List.of(
                    "0041", "1616", "2376", "2465", "0784AJ", "0784BE", "0784BM", "0784CE", "0784EH", "0784IC", "ZZOX",
                    "ZZ1X")),
            Map.entry("vendors", List.of(
                    "GIFTA - ARLINGTON AUTOMOTIVE LIMITED",
                    "TRELLEBORG SEALING SOLUTIONS",
                    "SCHAEFFLER TECHNOLOGIES AG & CO.KG",
                    "VIBRACOUSTIC SPAIN SAU",
                    "BOSCH AUTOMOTIVE PRODUCTS",
                    "CONTINENTAL ENGINEERING SERVICES",
                    "DENSO INTERNATIONAL EUROPE",
                    "MAGNA STEYR FAHRZEUGTECHNIK",
                    "VALEO CLIMATE CONTROL")),
            Map.entry("fiscalYears", List.of("2024-2025", "2025-2026", "2023-2024")),
            Map.entry("notificationMethods", List.of("Signed Contract", "Letter", "Email", "Verbal", "None")),
            Map.entry("systems",
                    List.of("Air Intake System", "Body Mechanisms", "Chassis Systems", "Electrical Distribution",
                            "Thermal Management")),
            Map.entry("parts", List.of("02C2D19768", "02C2C34128", "02NCA2246AB", "L8B29K335CC")),
            Map.entry("plants", List.of(
                    "Castle Bromwich Assembly", "Castle Bromwich KD", "Castle Bromwich KD, Magna Steyr - Graz",
                    "Magna Steyr - Graz", "Halewood KD", "Solihull Assembly")),
            Map.entry("fileTypes", List.of(
                    "Email from Supplier", "Quote", "Purchase Order", "Letter from Supplier", "NDA", "Other")),
            Map.entry("categories", List.of("Prompt Payment", "Inflation", "Settlement", "Other")),
            Map.entry("forums", List.of("Local Clearing House")),
            Map.entry("groups", List.of("employees", "supervisors", "finance")));

    @GetMapping("/{name}")
    public Map<String, Object> get(@PathVariable String name) {
        return Map.of("name", name, "values", LOOKUPS.getOrDefault(name, List.of()));
    }

    @GetMapping
    public Map<String, Object> all() {
        return Map.of("lookups", LOOKUPS);
    }
}
