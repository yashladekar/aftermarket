# aftermarket Backend — Spring Boot + Flowable

Single Spring Boot app owning the aftermarket claim/mandate domain (JPA, `app` schema)
plus embedded Flowable (own `flowable` schema). Mirrors the
`aftermarket-poc-master` workflow patterns, adapted to the `diagram.svg` Claim
Lifecycle and Mandate Approval flows and the Appian `MCI_*` domain model.

## Prereqs

- JDK 25, Maven 3.9+
- MySQL 8+ (or H2 for a smoke run, see below)

## Run with a local MySQL

The default datasource targets `localhost:3306/aftermarket` with `root`/`manager` and
creates the `aftermarket` database on first connect if it is missing:

```bash
cd backend
mvn spring-boot:run
```

Both the JPA domain tables and the Flowable `ACT_*` tables are auto-created in
the `aftermarket` database. Override the connection with `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD` if needed.

The JDBC URL keeps `nullDatabaseMeansCurrent=true`. Flowable probes for its
tables via `DatabaseMetaData.getTables(null, ...)`, and without this flag MySQL
Connector/J matches that against every database on the server. If any other
database on the instance already contains `ACT_*` tables (e.g. another
Flowable/Activiti project), Flowable wrongly assumes its schema exists and then
fails instead of creating its tables in `aftermarket` (flowable/flowable-engine#4095).

Backend listens on `http://localhost:8080`.

## Quick smoke run (H2, no Docker needed)

```cmd
cd backend
set SPRING_DATASOURCE_URL=jdbc:h2:mem:aftermarket-smoke;DB_CLOSE_DELAY=-1;INIT=CREATE SCHEMA IF NOT EXISTS app\;CREATE SCHEMA IF NOT EXISTS flowable
set SPRING_DATASOURCE_USERNAME=sa
set SPRING_DATASOURCE_PASSWORD=
set SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.h2.Driver
mvn spring-boot:run
```

## Tests

```bash
cd backend
mvn test
```

Covers the null-variable regression plus the full `claimLifecycle`
(low-value approve, high-value finance route + reject) and
`mandateApproval` (clearing + DOA) flows on H2.

## Seed users (password: `password`)

| Email | Groups |
|---|---|
| employee1@aftermarket.dev | employees |
| manager1@aftermarket.dev | employees, supervisors |
| finance1@aftermarket.dev | finance |

## Key endpoints (JWT Bearer required except login/health)

- `POST /api/auth/login` → `{ token, user }`
- `GET /api/auth/me`
- `GET /api/claims?status=&...`, `POST /api/claims`, `GET /api/claims/:lineId`,
  `PUT /api/claims/:lineId`, `POST /api/claims/:lineId/submit`,
  `GET /api/claims/:lineId/history|/audit|/notes`, `POST /api/claims/:lineId/notes`,
  `GET|POST /api/claims/:lineId/attachments`
- `GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks/:id/complete {decision, comment?}`,
  `POST /api/tasks/:id/claim`
- `GET /api/mandates`, `POST /api/mandates`, `POST /api/mandates/:number/submit`,
  `GET /api/mandates/approvals/view`
- `GET /api/notifications`, `GET /api/notifications/unread-count`,
  `POST /api/notifications/read-all|/:id/read`
- `GET /api/lookups[/:name]`, `GET /actuator/health`

## BPMN

- `processes/claimLifecycle.bpmn20.xml` (key `claimLifecycle`, businessKey = claim lineId):
  submit → manager approval (`supervisors`, reminder/escalation timers) →
  finance gate (threshold, `finance`) → finalize → approved/rejected.
- `processes/mandateApproval.bpmn20.xml` (key `mandateApproval`, businessKey = mandate number):
  clearing review (`supervisors`) → DOA approval (`finance`) → outcome.

Role-based access is enforced at task completion (`assignee | candidate
group | claim:read:all`); engine events emit role-targeted notifications.
