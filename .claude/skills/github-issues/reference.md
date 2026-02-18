# GitHub Issues Reference

## Issue Creation Commands

### Create a feature issue

```bash
gh issue create \
  --title "Feature title" \
  --body "## Description
What needs to be built and why.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3" \
  --label "feature" \
  --milestone "Iteration 1" \
  --assignee "user1,user2"
```

### Create a task issue

```bash
gh issue create \
  --title "Task title" \
  --body "## Description
What needs to be done.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2" \
  --label "task" \
  --milestone "Iteration 1" \
  --assignee "user1"
```

### Create a bug issue

```bash
gh issue create \
  --title "Bug title" \
  --body "## Description
What is broken and what was expected.

## Steps to Reproduce
1. Step 1
2. Step 2

## Acceptance Criteria
- [ ] The bug is fixed" \
  --label "bug" \
  --milestone "Iteration 1" \
  --assignee "user1"
```

## Milestone Management

### List milestones

```bash
gh api repos/{owner}/{repo}/milestones
```

### Create a milestone

```bash
gh api repos/{owner}/{repo}/milestones -f title="Iteration 1"
```

## Label Management

### List labels

```bash
gh label list
```

### Create required labels

```bash
gh label create feature --description "New functionality" --color 0E8A16
gh label create task --description "Development task" --color 1D76DB
gh label create bug --description "Something is broken" --color D93F0B
gh label create retrospective --description "Iteration retrospective" --color FBCA04
```
