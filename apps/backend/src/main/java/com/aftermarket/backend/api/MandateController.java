package com.aftermarket.backend.api;

import com.aftermarket.backend.domain.MandateRequest;
import com.aftermarket.backend.service.IdentityService;
import com.aftermarket.backend.service.MandateService;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mandates")
public class MandateController {

    private final MandateService mandates;
    private final IdentityService identity;

    public MandateController(MandateService mandates, IdentityService identity) {
        this.mandates = mandates;
        this.identity = identity;
    }

    @GetMapping
    public List<MandateRequest> list() {
        return mandates.list();
    }

    @PostMapping
    public MandateRequest create(Authentication authentication, @RequestBody(required = false) Map<String, Object> payload) {
        IdentityService.SessionUser user = identity.sessionFor(authentication.getName());
        return mandates.create(user.id(), user.name(), payload == null ? Map.of() : payload);
    }

    @GetMapping("/{number}")
    public MandateRequest get(@PathVariable String number) {
        return mandates.get(number);
    }

    @PostMapping("/{number}/submit")
    public MandateRequest submit(Authentication authentication, @PathVariable String number) {
        return mandates.submit(authentication.getName(), number);
    }

    @GetMapping("/approvals/view")
    public List<Map<String, Object>> approvals() {
        return mandates.list().stream().map(mandate -> {
            Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("id", mandate.getNumber());
            row.put("requestType", mandate.getRequestType());
            row.put("category", mandate.getCategory());
            row.put("level", mandate.getLevel());
            row.put("overall", mandate.getOverall());
            row.put("clearing", mandate.getClearing() == null ? "" : mandate.getClearing());
            row.put("doa", mandate.getDoa() == null ? "" : mandate.getDoa());
            row.put("valueVat", "");
            row.put("initialTotal", "-");
            row.put("risks", "(50,000.0000)");
            row.put("risksNegative", true);
            row.put("opportunities", "0.0000");
            row.put("vendorCode", mandate.getVendorCode() == null ? "" : mandate.getVendorCode());
            row.put("vendorName", mandate.getVendorName() == null ? "" : mandate.getVendorName());
            row.put("coc", mandate.getCoc() == null ? "" : mandate.getCoc());
            row.put("raiser", mandate.getRaiser() == null ? "" : mandate.getRaiser());
            row.put("stakeholders", mandate.getStakeholders() == null ? "" : mandate.getStakeholders());
            row.put("daysPending", "0");
            row.put("openEnquiries", "");
            row.put("actionOutside", "");
            row.put("ageDate", "");
            return row;
        }).toList();
    }
}
