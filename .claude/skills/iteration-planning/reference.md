# Iteration Planning Reference

## Iteration Plan Structure

Every iteration plan has exactly 3 sections:

### 1. Requirements & Acceptance Criteria

```plaintext
### Requirement Title
**Description:** What needs to be built
**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
```

Each criterion must be testable — someone should be able to verify it passes or fails.

### 2. Coordination & Design Decisions

Document decisions the team has made:

- Architecture choices (e.g., "We'll use a REST API, not GraphQL")
- API contracts and shared interfaces
- Who is responsible for what
- Dependencies between tasks (e.g., "Auth must land before profile page")

### 3. Task Breakdown

| Task                 | Type    | Assignee(s)  | Issue # |
| -------------------- | ------- | ------------ | ------- |
| Implement login form | feature | @alice, @bob | #5      |
| Set up CI pipeline   | task    | @carol       | #6      |
| Fix redirect bug     | bug     | @dave        | #7      |

Rules:

- `feature` issues get **2 assignees** (collaborative work)
- `task` and `bug` issues get **1 assignee**
- Every task maps to exactly one GitHub issue
- Only include tasks for the **current** iteration

## Timeline

- **Iteration plan due:** Tuesday 6 PM of Week 1
- **Iteration work period:** remainder of Week 1 + Week 2
- **Retrospective due:** Monday end-of-day after the iteration ends
