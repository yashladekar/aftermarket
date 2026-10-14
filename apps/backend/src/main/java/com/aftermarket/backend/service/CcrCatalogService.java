package com.aftermarket.backend.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CcrCatalogService {

    public record VendorOption(String code, String name) {
    }

    public record VendorPart(
            String vendorCode,
            String partNumber,
            String description,
            String manufacturerPartNumber,
            String netPrice,
            String per,
            String moq,
            String currentOrderMultiple,
            String leadTime) {
    }

    private static VendorPart vp(
            String vendorCode,
            String partNumber,
            String description,
            String manufacturerPartNumber,
            String netPrice,
            String leadTime) {
        return new VendorPart(
                vendorCode, partNumber, description, manufacturerPartNumber, netPrice, "1", "50", "10", leadTime);
    }

    private static final List<VendorOption> VENDORS = List.of(
            new VendorOption("MRDFN", "MERIDIAN FASTENERS LTD"),
            new VendorOption("HLPOL", "HALSTEAD POLYMERS PLC"),
            new VendorOption("EVDLS", "EASTVALE DRIVELINE SYSTEMS GMBH"),
            new VendorOption("NWSSL", "NORTHWICK SEALING SOLUTIONS LTD"),
            new VendorOption("CFDCO", "CALDER FRICTION COMPONENTS LTD"),
            new VendorOption("ASHEL", "ASHBOURNE ELECTRICAL LTD"),
            new VendorOption("KSTAL", "KESTREL ALLOY WHEELS LTD"),
            new VendorOption("DNMGS", "DUNMORE GLASS SYSTEMS LTD"),
            new VendorOption("BRKWD", "BROOKWOOD CASTINGS LTD"),
            new VendorOption("THRNC", "THORNCROFT HYDRAULICS LTD"),
            new VendorOption("WLMBY", "WILMBURY INTERIORS GMBH"),
            new VendorOption("FENGR", "FENWICK GEARS & TRANSMISSION LTD"));

    private static final List<VendorPart> PARTS = List.of(
            vp("MRDFN", "5201140783", "Hex flange bolt M8 x 30", "MF-52140", "0.8450", "14 days"),
            vp("MRDFN", "5201140784", "Hex flange bolt M8 x 35", "MF-52141", "0.9120", "14 days"),
            vp("MRDFN", "5201140811", "Wheel stud M14 x 1.5", "MF-52207", "1.2740", "21 days"),
            vp("HLPOL", "6108823451", "Coolant hose assembly", "HP-61021", "8.4600", "21 days"),
            vp("HLPOL", "6108823519", "Air intake duct", "HP-61088", "12.1300", "28 days"),
            vp("HLPOL", "6108823520", "Air intake duct clip kit", "HP-61089", "2.5400", "28 days"),
            vp("EVDLS", "7305561290", "Propshaft centre bearing", "EV-73011", "24.9000", "35 days"),
            vp("EVDLS", "7305561402", "Rear drive coupling", "EV-73019", "41.7500", "35 days"),
            vp("NWSSL", "4402091765", "Crankshaft front seal", "NW-44051", "3.2800", "14 days"),
            vp("NWSSL", "4402091766", "Crankshaft rear seal", "NW-44052", "3.6100", "14 days"),
            vp("NWSSL", "4402091889", "Camshaft seal kit", "NW-44077", "5.9400", "21 days"),
            vp("CFDCO", "8804319927", "Front brake pad set", "CF-88031", "18.2500", "21 days"),
            vp("CFDCO", "8804320054", "Rear brake pad set", "CF-88042", "16.9800", "21 days"),
            vp("ASHEL", "3107754208", "Wiring harness branch", "AS-31055", "9.7200", "28 days"),
            vp("KSTAL", "1509936274", "Alloy wheel 20 inch", "KS-15011", "132.4000", "42 days"),
            vp("KSTAL", "1509936330", "Alloy wheel 21 inch", "KS-15018", "148.9000", "42 days"),
            vp("DNMGS", "9901625380", "Windscreen glass assembly", "DN-99012", "86.3000", "35 days"),
            vp("BRKWD", "7703412055", "Suspension knuckle casting", "BW-77034", "54.6000", "42 days"),
            vp("THRNC", "6605187741", "Hydraulic pump unit", "TH-66051", "97.8500", "35 days"),
            vp("WLMBY", "2804469137", "Door trim panel insert", "WL-28044", "11.3700", "28 days"),
            vp("FENGR", "1902275062", "Transfer box gear set", "FE-19022", "63.2000", "42 days"));

    public List<VendorOption> vendors() {
        return VENDORS;
    }

    public String vendorName(String code) {
        return VENDORS.stream()
                .filter(v -> v.code().equals(code))
                .map(VendorOption::name)
                .findFirst()
                .orElse(code);
    }

    public List<VendorPart> parts(String vendorCode, String query) {
        String q = query == null ? "" : query.trim().toLowerCase();
        List<VendorPart> out = new ArrayList<>();
        for (VendorPart part : PARTS) {
            if (vendorCode != null && !vendorCode.isBlank() && !part.vendorCode().equals(vendorCode)) {
                continue;
            }
            if (!q.isEmpty()
                    && !(part.partNumber().toLowerCase().contains(q)
                            || part.description().toLowerCase().contains(q))) {
                continue;
            }
            out.add(part);
        }
        return out;
    }

    public Map<String, Object> all() {
        Map<String, Object> lookups = new LinkedHashMap<>();
        lookups.put("vendors", VENDORS);
        lookups.put("parts", PARTS);
        lookups.put(
                "ccrTypes", List.of("Price Change", "Commercial Terms", "Logistics Change", "Quality Hold"));
        lookups.put("priorities", List.of("High", "Medium", "Low"));
        lookups.put(
                "onBehalfReasons",
                List.of(
                        "Supplier Does Not Have Covisint Access",
                        "Supplier Does Not Want To Use Appian",
                        "Supplier Requires Onboarding",
                        "Short Term Access Issue",
                        "Escalation",
                        "Other"));
        lookups.put("fileTypes", List.of("Quote", "Cost Breakdown", "Allocation", "Others"));
        return lookups;
    }
}
