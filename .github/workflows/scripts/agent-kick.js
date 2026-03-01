// Script: agent-kick.js
// Posted as a comment on an issue when the 'agent:build-pr' label is applied.
// Provides a ready-to-use Copilot coding agent prompt for implementation.
module.exports = async ({ github, context }) => {
  const MARKER = '<!-- AGENT_KICK_V1 -->';
  const issueNumber = context.issue.number;
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // Guard: avoid duplicate comments
  const { data: comments } = await github.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  });
  const alreadyPosted = comments.some(c => c.body.includes(MARKER));
  if (alreadyPosted) {
    console.log('Agent kick comment already posted – skipping.');
    return;
  }

  // Fetch the issue body for context
  const { data: issue } = await github.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });

  const body = `${MARKER}
## 🤖 Copilot Coding Agent – Implementation Instructions

The \`agent:build-pr\` label has been applied to this issue.
A human should now open **GitHub Copilot Workspace** (or the Copilot coding agent panel) and use the prompt below.

---

### Ready-to-use prompt

> **Copy the text below and paste it into the Copilot coding agent prompt field.**

\`\`\`
You are implementing the feature described in issue #${issueNumber} of the ${owner}/${repo} repository.

Issue title: ${issue.title}

Steps:
1. Read the full issue body carefully, including the Acceptance Criteria and Test Plan sections.
2. If any Acceptance Criteria are missing or ambiguous, do NOT proceed with implementation.
   Instead, post a comment on this issue explaining what is unclear, and apply the label \`agent:blocked\`.
3. Create a new branch named \`feature/issue-${issueNumber}-<short-slug>\` from \`master\`.
4. Implement the feature according to the Acceptance Criteria.
5. Add or update tests as described in the Test Plan section.
6. Ensure \`go test ./...\` passes and \`golangci-lint run\` produces no new errors.
7. Open a Pull Request targeting \`master\` using the repository PR template.
   - Fill in all sections: linked issue, summary, AC checklist, test evidence, risk/roll-back.
   - Reference this issue in the PR body (e.g. "Closes #${issueNumber}").
\`\`\`

---

### Labels to use during the agent run

| Label | When to apply |
|---|---|
| \`agent:build-pr\` | Applied by a human to kick off this agent run |
| \`agent:blocked\` | Apply if AC are missing or something is unclear |
| \`agent:needs-human\` | Apply if a decision outside the agent's scope is required |

---

> ℹ️ **Note:** This comment was posted automatically when the \`agent:build-pr\` label was applied. The Copilot coding agent does **not** run automatically – a human must start it using the prompt above.
`;

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
};
