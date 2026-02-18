---
name: github-issues
description: Create and manage GitHub issues following project conventions. Use when creating issues, managing issue labels, assigning issues, setting up milestones, or asking about issue conventions and requirements.
argument-hint: "issue title or number"
allowed-tools:
  - Read
  - Grep
  - Glob
  - "Bash(gh issue *)"
  - "Bash(gh api *)"
  - "Bash(gh label *)"
---

# GitHub Issues Skill

## Related Skills

- `iteration-planning` — creates issues from the task breakdown
- `pr-workflow` — PRs reference issues via `Closes #<number>`

## Creating Issues

Every issue must have:

1. **Descriptive title** — clear and concise
2. **Description** — what needs to be done and why
3. **Acceptance criteria** — checklist of testable criteria
4. **Label** — exactly one of: `feature`, `task`, or `bug`
5. **Milestone** — the current iteration (e.g., "Iteration 1")
6. **Assignees** — 2 people for features, 1 for tasks/bugs

## Labels

The project uses these labels:

- `feature` — new functionality
- `task` — development work that isn't a feature or bug
- `bug` — something that's broken
- `retrospective` — added alongside `task` for retrospective issues

If labels don't exist yet, create them:

```bash
gh label create feature --description "New functionality" --color 0E8A16
gh label create task --description "Development task" --color 1D76DB
gh label create bug --description "Something is broken" --color D93F0B
gh label create retrospective --description "Iteration retrospective" --color FBCA04
```

## Milestones

Milestones are named "Iteration 1" through "Iteration 4". Create them if they don't exist:

```bash
gh api repos/{owner}/{repo}/milestones -f title="Iteration 1"
```

## Rules

- Only create issues for the **current** iteration — never for future ones
- Feature issues always get **2 assignees** (collaborative work)
- Task and bug issues get **1 assignee**
- Use the GitHub issue templates (feature, task, or bug) when creating from the UI
