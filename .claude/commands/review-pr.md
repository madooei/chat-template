---
description: Review a pull request for code quality, conventions, and correctness
---

Review pull request $ARGUMENTS.

## Steps

1. Get the PR details: `gh pr view $ARGUMENTS --json title,body,baseRefName,headRefName,files,additions,deletions`
2. Get the diff: `gh pr diff $ARGUMENTS`
3. Read the PR description and understand the intent — what issue does it close, what does it change?
4. Review the changes against these categories:

### Conventions

- Branch name follows `<author>/<type>/issue-<number>-<short-description>`
- Commits reference issue numbers
- PR body includes `Closes #<number>` or `Fixes #<number>`
- PR is under ~400 changed lines

### Code Quality

- Types are correct and meaningful (no unnecessary `any`)
- Feature pipeline is followed: types -> store -> hooks -> components -> pages
- Components don't access stores directly (they go through hooks)
- No leftover debug code, console.logs, or TODOs that should be addressed

### Style

- Naming follows project conventions (camelCase for variables, PascalCase for components)
- No formatting issues (Prettier should handle this, but check for overrides)
- Imports are clean — no unused imports, no circular dependencies

### Correctness

- Logic handles edge cases (empty states, loading states, error states)
- No obvious bugs or race conditions
- Tests cover the changed behavior

5. Summarize findings as:
   - **Must fix** — issues that should block merge
   - **Should fix** — improvements worth making before merge
   - **Nitpicks** — minor suggestions, not blocking
   - **Looks good** — things done well (always include at least one)
