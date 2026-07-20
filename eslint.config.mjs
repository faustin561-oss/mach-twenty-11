// Next.js 16 removed `next lint` and no longer auto-lints during
// `next build` (confirmed via Next's official "Upgrading: Version 16"
// docs) — this file is what makes `npm run lint` (now plain `eslint .`)
// actually work, using ESLint's flat config format required by
// eslint-config-next@16's peer dependency on eslint >=9.
//
// FlatCompat is Next's own documented bridge for consuming
// eslint-config-next's exports under flat config — not a workaround I
// invented. Not required for `next build` to succeed (it doesn't lint
// anymore either way), but leaving `npm run lint` silently broken after
// bumping ESLint would just be a different half-finished state.
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.config({ extends: ["next"] }),
  {
    ignores: ["node_modules/**", ".next/**", "public/**"],
  },
];

export default eslintConfig;
