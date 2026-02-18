---
description: Create a commit with a well-structured message following project conventions
---

Create a checkpoint commit for the current changes.

## Steps

1. Run `git status` to see what has changed (never use `-uall`).
2. Run `git diff --staged` and `git diff` to understand both staged and unstaged changes.
3. Run `git log --oneline -5` to see the recent commit style.
4. Stage the relevant files by name — avoid `git add -A` to prevent accidentally including sensitive files.
5. Write a commit message that:
   - Uses imperative mood ("Add feature" not "Added feature")
   - Keeps the subject line under 72 characters
   - References the issue number if one is relevant: `Add login form (#5)`
   - Adds a body paragraph if the change is non-trivial, explaining _why_ not just _what_
6. Create the commit.
7. Run `git status` to verify.
