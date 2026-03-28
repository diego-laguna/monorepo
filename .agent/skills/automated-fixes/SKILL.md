---
name: Automated Fixes
description: Apply automated formatting (Prettier) and linting (ESLint) fixes to currently changed files (unstaged and uncommitted). Triggered when the user asks to apply automated fixes, run linting, format code, or fix lint errors on current changes.
---

# Automated Fixes Skill

Apply Prettier formatting and ESLint auto-fixes to **only the files with current unstaged/uncommitted changes** in the monorepo.

## Trigger Phrases

Activate this skill when the user asks to:
- "apply automated fixes"
- "fix lint errors"
- "format and lint"
- "run formatter and linter"
- "fix my changes"
- "lint my changes"

## Prerequisites

- The working directory is the monorepo root: `/home/diego/Documents/code/monorepo`
- Tools used: `prettier` (formatter), `eslint` (linter)
- Package manager: `pnpm`

## Workflow

### Step 1: Identify Changed Files

Get the list of currently changed files (unstaged + staged but uncommitted). Only include lintable file extensions (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.json`, `.css`, `.html`).

```bash
# Get unstaged and staged-but-uncommitted changed files, filter to lintable extensions
git diff --name-only --diff-filter=d HEAD 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|mjs|cjs|json|css|html)$' | sort -u
```

> [!IMPORTANT]
> If `git diff --name-only --diff-filter=d HEAD` returns nothing (e.g., no commits yet or all changes are untracked), fall back to:
> ```bash
> git diff --name-only --diff-filter=d
> git diff --name-only --cached --diff-filter=d
> git ls-files --others --exclude-standard
> ```
> Combine all results, deduplicate with `sort -u`, and filter by the lintable extensions listed above.

If no changed files are found, inform the user: _"No changed files detected. Nothing to fix."_ — and stop.

Store the resulting file list for use in all subsequent steps.

### Step 2: Run Prettier (Formatter)

Run Prettier on all changed files using `npx` from the monorepo root:

```bash
npx prettier --write <file1> <file2> ...
```

- Pass the full list of changed files as arguments.
- If Prettier is not installed, install it first: `pnpm add -D prettier -w`
- Report which files were formatted.

### Step 3: Run ESLint with `--fix` (Auto-fix)

Run ESLint with the `--fix` flag on all changed files:

```bash
npx eslint --fix <file1> <file2> ...
```

- This will auto-fix any issues that ESLint can resolve automatically.
- Report any remaining errors that could not be auto-fixed.

### Step 4: Lint-Check-Fix Loop (max 3 iterations)

After the auto-fix pass, run ESLint **without** `--fix` to check for remaining issues:

```bash
npx eslint <file1> <file2> ...
```

**If ESLint reports errors:**

1. Read and analyze each reported error (file, line, rule, message).
2. Open the affected files and apply manual fixes based on the ESLint error messages.
3. Follow the project's coding conventions from `gemini.md`:
   - Prefix unused variables with `_` (e.g., `_e` in catch blocks).
   - Handle floating promises with `await` or `void`.
   - Avoid `any` — use proper types instead.
   - Follow React hooks rules (no conditional hooks).
4. After applying fixes, re-run ESLint without `--fix`:
   ```bash
   npx eslint <file1> <file2> ...
   ```

**Repeat this check-fix cycle up to 3 times maximum.** 

- **If all errors are resolved** at any point → proceed to Step 5.
- **If errors remain after 3 iterations** → proceed to Step 5 and report the unresolved errors.

### Step 5: Final Report

Provide a summary to the user:

- ✅ **Formatted files**: list of files Prettier formatted
- ✅ **Auto-fixed files**: list of files ESLint `--fix` corrected
- ✅ **Manually fixed issues**: list of issues you resolved in the loop
- ❌ **Unresolved errors** (if any): list remaining ESLint errors with file, line, rule, and message

## Important Notes

- **Scope**: Only operate on changed files. Never run formatters or linters on the entire codebase.
- **Non-destructive**: The `--diff-filter=d` flag excludes deleted files so we don't try to lint files that no longer exist.
- **Per-app configs**: Each app has its own ESLint config. `npx eslint` from the monorepo root will resolve the correct config per file automatically via the flat config system.
- **Prettier config**: `scraper-api` has a `.prettierrc`. Other apps will use Prettier defaults. This is fine — Prettier resolves configs per-file.
