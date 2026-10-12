# `@workspace/eslint-config`

Shared flat ESLint configs.

- `@workspace/eslint-config/base` — non-React base (js + typescript-eslint + turbo)
- `@workspace/eslint-config/next-js` — Next.js apps (`apps/web`)
- `@workspace/eslint-config/react-internal` — React libraries (`packages/ui`)

All reports are downgraded to warnings via `eslint-plugin-only-warn`.

```js
import { nextJsConfig } from "@workspace/eslint-config/next-js"

export default nextJsConfig
```
