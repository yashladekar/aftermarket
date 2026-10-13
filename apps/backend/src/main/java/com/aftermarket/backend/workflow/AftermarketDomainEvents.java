package com.aftermarket.backend.workflow;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Legacy domain event handler — retained as a Spring bean for backward compatibility.
 * The old claimLifecycle and mandateApproval BPMN processes have been removed.
 * All active workflow event handling is now done by {@link CcrDomainEvents}.
 */
@Component("domainEvents")
public class AftermarketDomainEvents {

    private static final Logger log = LoggerFactory.getLogger(AftermarketDomainEvents.class);

    public AftermarketDomainEvents() {
        log.info("AftermarketDomainEvents bean initialized (legacy — no active BPMN processes)");
    }
}
