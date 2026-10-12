# NEO — Turborepo monorepo

A pnpm + [Turborepo](https://turbo.build/repo) workspace for the NEO project.

## Layout

```
neo/
├── apps/
│   ├── backend/   # Spring Boot + embedded Flowable service (Java 25, Maven)
│   └── web/       # Next.js frontend (React 19, Tailwind v4)
├── packages/
│   ├── ui/                # @workspace/ui — shadcn/ui kit, hooks, theme CSS
│   ├── eslint-config/     # @workspace/eslint-config — shared flat ESLint configs
│   └── typescript-config/ # @workspace/typescript-config — shared tsconfig bases
├── schema.sql     # MCI reference schema (Appian)
├── diagram.svg    # Claim Lifecycle / Mandate Approval flows
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Prereqs

- Node.js >= 20 and [pnpm](https://pnpm.io) 11
- JDK 25 and Maven 3.9+ (for `apps/backend`)
- MySQL 8+ running locally (or use the Docker compose file in `apps/backend`)

## Install

```bash
pnpm install
```

## Common commands

Run from the repo root:

| Command            | What it does                                             |
| ------------------ | -------------------------------------------------------- |
| `pnpm dev`         | Runs every package's `dev` task via Turbo                |
| `pnpm build`       | Builds every package (`next build` + `mvn package`)      |
| `pnpm lint`        | Lints every package that defines a `lint` script         |
| `pnpm typecheck`   | Type-checks every package that defines a `typecheck`     |
| `pnpm test`        | Runs tests (backend Maven test suite)                    |
| `pnpm format`      | Formats every package                                    |

Scoped shortcuts:

```bash
pnpm web:dev        # next dev  (apps/web)
pnpm backend:dev    # mvn spring-boot:run  (apps/backend)
pnpm backend:build  # mvn package
pnpm backend:test   # mvn test
```

You can also target a single workspace directly:

```bash
pnpm --filter web dev
pnpm --filter backend test
```

## Notes

- Turbo caches the `build`, `lint`, `typecheck`, `format` and `test` tasks; `dev` is persistent and uncached.
- The Java backend is exposed to Turbo through `apps/backend/package.json`, whose scripts simply wrap Maven.
- Backend runs on `http://localhost:8080`; the web app reads `BACKEND_URL` (see `apps/web/.env.example`).
