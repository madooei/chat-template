# PR Workflow Reference

## Common Commands

### Create a PR

```bash
gh pr create --title "Title" --body "Body" --reviewer "username"
```

### List open PRs

```bash
gh pr list
```

### View a PR

```bash
gh pr view <number>
```

### Check PR diff size

```bash
gh pr diff <number> --stat
```

### Merge a PR (merge commit only)

```bash
gh pr merge <number> --merge --delete-branch
```

## Branch Naming Validation

Before creating a PR, verify the branch name matches the convention:

```plaintext
<author>/<type>/issue-<number>-<short-description>
```

Check with:

```bash
git branch --show-current
```

## Collaborative Feature Branch Flow

```plaintext
master
  └── team/feature/issue-5-user-auth        (feature branch)
        ├── alice/feature/issue-5-login-form   (sub-branch)
        └── bob/feature/issue-5-auth-api       (sub-branch)
```

### Create the feature branch

```bash
git checkout master
git pull
git checkout -b team/feature/issue-5-user-auth
git push -u origin team/feature/issue-5-user-auth
```

### Create a sub-branch

```bash
git checkout team/feature/issue-5-user-auth
git pull
git checkout -b alice/feature/issue-5-login-form
```

### PR for sub-branch (targets feature branch, not master)

```bash
gh pr create --base team/feature/issue-5-user-auth --title "Add login form" --body "Closes #5 (partial)"
```

### Final PR to master

```bash
gh pr create --base master --title "User authentication" --body "Closes #5"
```
