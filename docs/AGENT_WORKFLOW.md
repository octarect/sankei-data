# Agent Workflow

This document describes the Issue-to-PR workflow that uses GitHub labels to trigger
Copilot coding agent instruction comments.

---

## Overview

```
┌──────────────────────────────────────────────────────────────┐
│  1. Human creates Issue (feature_request / bug_report)       │
│     using the provided templates                             │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  2. Human applies label: agent:build-pr                      │
└───────────────────────────┬──────────────────────────────────┘
                            │ GitHub Actions (agent-kick.yml)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  3. Bot posts an instruction comment on the Issue            │
│     containing a ready-to-use Copilot coding agent prompt    │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  4. Human opens Copilot Workspace / coding agent panel       │
│     Pastes the prompt and starts the agent                   │
│     Agent creates branch, implements, adds tests, opens PR   │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  5. Human reviews the draft PR                               │
│     Applies label: agent:review                              │
└───────────────────────────┬──────────────────────────────────┘
                            │ GitHub Actions (agent-review-kick.yml)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  6. Bot posts an instruction comment on the PR               │
│     containing a ready-to-use Copilot review agent prompt    │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  7. Human opens Copilot Workspace / coding agent panel       │
│     Pastes the review prompt and starts the agent            │
│     Agent posts summary, inline comments, AC checklist,      │
│     and risk notes as a PR review                            │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  8. Human reviews agent feedback, merges or requests changes │
│     CI checks (Go test + lint) must pass before merge        │
└──────────────────────────────────────────────────────────────┘
```

---

## Required Labels

The following labels must exist in the repository before the workflows will work correctly.
GitHub Actions cannot create labels portably, so a human must create them once.

| Label | Color (suggested) | Purpose |
|---|---|---|
| `agent:build-pr` | `#0075ca` (blue) | Kick off the Copilot coding agent to implement the issue |
| `agent:review` | `#e4e669` (yellow) | Kick off the Copilot coding agent to review a PR |
| `agent:blocked` | `#d73a4a` (red) | Applied by the agent when AC are missing or unclear |
| `agent:needs-human` | `#e99695` (pink) | Applied when a decision outside the agent's scope is required |

### Creating labels via GitHub CLI

Run the following commands once per repository (requires `gh` CLI and write access):

```bash
gh label create "agent:build-pr"    --color "0075ca" --description "Kick off Copilot coding agent to implement the issue"  --repo octarect/sankei-data
gh label create "agent:review"      --color "e4e669" --description "Kick off Copilot coding agent to review a PR"           --repo octarect/sankei-data
gh label create "agent:blocked"     --color "d73a4a" --description "Agent blocked: AC missing or unclear"                   --repo octarect/sankei-data
gh label create "agent:needs-human" --color "e99695" --description "Human decision required"                                --repo octarect/sankei-data
```

### Creating labels via GitHub UI

1. Go to **Issues → Labels** in the repository.
2. Click **New label**.
3. Enter the label name, description, and colour as listed in the table above.
4. Click **Create label**.

---

## Workflow Files

| File | Trigger | Action |
|---|---|---|
| `.github/workflows/ci.yml` | `push` / `pull_request` to `master` | Runs `go test ./...` and `golangci-lint` |
| `.github/workflows/agent-kick.yml` | Issue labeled with `agent:build-pr` | Posts implementation instruction comment on the issue |
| `.github/workflows/agent-review-kick.yml` | PR labeled with `agent:review` | Posts review instruction comment on the PR |

### Duplicate-comment guard

Each workflow checks for a unique HTML marker (`AGENT_KICK_V1` / `AGENT_REVIEW_KICK_V1`)
in existing comments before posting. Re-applying the label will not create a second comment.

---

## Branch Protection Recommendations

To ensure CI checks gate merges, configure the following branch protection rules for `master`:

1. Go to **Settings → Branches → Add rule** for `master`.
2. Enable **Require status checks to pass before merging**.
3. Add the following required checks:
   - `Test` (from `ci.yml`)
   - `Lint` (from `ci.yml`)
4. Enable **Require a pull request before merging**.
5. Optionally enable **Require review from Code Owners** for additional safety.

---

## Issue Templates

| Template | Use for |
|---|---|
| `feature_request.yml` | New features or enhancements |
| `bug_report.yml` | Bug reports and regressions |

Blank issues are disabled (`config.yml`) to encourage structured submissions.

---

## PR Template

`.github/pull_request_template.md` provides sections for:

- Linked issue
- Summary
- Acceptance Criteria checklist
- Test evidence
- Risk & roll-back plan
