# `@workspace/typescript-config`

Shared `tsconfig.json` bases for the workspace.

- `base.json` — default compiler options
- `nextjs.json` — for Next.js apps (`apps/web`)
- `react-library.json` — for React libraries (`packages/ui`)

Extend one of these from a package's `tsconfig.json`:

```json
{
  "extends": "@workspace/typescript-config/nextjs.json"
}
```
