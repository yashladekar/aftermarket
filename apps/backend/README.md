# aftermarket Backend — Spring Boot + Flowable

Single Spring Boot app owning the aftermarket CCR domain (JPA, `app` schema)
plus embedded Flowable (own `flowable` schema). Mirrors the
`aftermarket-poc-master` workflow patterns, adapted to the CCR approval flow
(`processes/ccrApproval.bpmn20.xml`) and the Appian `MCI_*` domain model.

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

Covers the null-variable regression plus the full `ccrApproval`
(manager → finance route, approve and reject paths) flow on H2.

## Seed users (password: `password`)

| Email | Groups |
|---|---|
| employee1@aftermarket.dev | employees |
| manager1@aftermarket.dev | employees, supervisors |
| finance1@aftermarket.dev | finance |

## Key endpoints (JWT Bearer required except login/health)

- `POST /api/auth/login` → `{ token, user }`
- `GET /api/auth/me`
- `GET /api/ccrs?…`, `POST /api/ccrs`, `GET|PUT /api/ccrs/:reference`,
  `POST /api/ccrs/:reference/submit`,
  `GET /api/ccrs/:reference/history|/activity|/attachments`,
  `GET /api/ccrs/catalog/vendors|/parts|/lookups`
- `GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks/:id/complete {decision, comment?}`,
  `POST /api/tasks/:id/claim`
- `GET /api/notifications`, `GET /api/notifications/unread-count`,
  `POST /api/notifications/read-all|/:id/read`
- `GET /actuator/health`

## BPMN

- `processes/ccrApproval.bpmn20.xml` (key `ccrApproval`, businessKey = CCR reference):
  submit → manager approval (`supervisors`, reminder/escalation timers) →
  finance approval (`finance`) → finalize → approved/rejected.

Role-based access is enforced at task completion (`assignee | candidate
group | ccr:read:all`); engine events emit role-targeted notifications.
