---
name: retrospective
description: Create iteration retrospective issues. Use when writing a retrospective, closing out an iteration, reflecting on iteration progress, or asking about retrospective format.
argument-hint: "iteration number"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - "Bash(gh issue *)"
  - "Bash(gh api *)"
---

# Retrospective Skill

## Related Skills

- `iteration-planning` — the iteration plan this retrospective reviews
- `github-issues` — conventions for the retrospective issue

## Process

1. Ask for the iteration number (or infer from recent milestones)
2. Review what was accomplished by reading:
   - The iteration plan (`docs/iteration-<number>-plan.md`)
   - Closed issues and merged PRs in the iteration's milestone
3. Create a GitHub issue titled **"Iteration X Retrospective"**

## Issue Format

- **Labels:** `task`, `retrospective`
- **Milestone:** Current iteration (e.g., "Iteration 1")
- **Assignees:** All team members

### Issue Body Structure

```markdown
## What Went Well

- (bullet points)

## What Didn't Go Well

- (bullet points)

## Lessons Learned

- (bullet points)
```

## Guidelines

- Be specific — reference actual issues, PRs, or events
- Focus on process improvements, not blame
- Each section should have at least 2-3 bullet points
- The retrospective is due **Monday end-of-day** after the iteration ends
- Encourage the team to comment on the issue with their own reflections
