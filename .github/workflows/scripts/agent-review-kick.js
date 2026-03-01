// Script: agent-review-kick.js
// Posted as a comment on a PR when the 'agent:review' label is applied.
// Provides a ready-to-use Copilot review agent prompt.
module.exports = async ({ github, context }) => {
  const MARKER = '<!-- AGENT_REVIEW_KICK_V1 -->';
  const prNumber = context.issue.number;
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // Guard: avoid duplicate comments
  const { data: comments } = await github.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  });
  const alreadyPosted = comments.some(c => c.body.includes(MARKER));
  if (alreadyPosted) {
    console.log('Agent review kick comment already posted – skipping.');
    return;
  }

  // Fetch PR details
  const { data: pr } = await github.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  const body = `${MARKER}
## 🤖 Copilot Coding Agent – Review Instructions

The \`agent:review\` label has been applied to this pull request.
A human should now open **GitHub Copilot Workspace** (or the Copilot coding agent panel) and use the prompt below.

---

### Ready-to-use prompt

> **Copy the text below and paste it into the Copilot coding agent prompt field.**

\`\`\`
You are reviewing Pull Request #${prNumber} ("${pr.title}") in the ${owner}/${repo} repository.

Perform the following review tasks:

(a) SUMMARY REVIEW
    Write a concise summary (3–5 sentences) describing:
    - What this PR changes and why
    - Whether the overall approach is sound
    - Any high-level concerns

(b) INLINE COMMENTS
    For each concrete issue you find (bugs, style violations, missing error handling, test gaps, etc.):
    - Post an inline review comment on the relevant file and line
    - Clearly state the problem and provide a specific suggested fix or improvement
    - Do NOT post vague or low-value comments

(c) ACCEPTANCE CRITERIA CHECKLIST
    Find the linked issue (look for "Closes #..." or "Fixes #..." in the PR body).
    List each Acceptance Criterion from that issue and mark it as:
    - ✅ Met – with a one-line explanation of how
    - ❌ Not met – with a one-line explanation of what is missing
    - ⚠️ Partially met – with a one-line explanation

(d) RISK NOTES
    Identify any risks introduced by this PR:
    - Breaking changes to public APIs or data formats
    - Performance regressions
    - Security concerns
    - Missing rollback strategy
    For each risk, suggest a mitigation.

Post all of the above as a single pull request review (not separate comments).
Set the review state to:
- APPROVE if all AC are met and there are no blocking issues
- REQUEST_CHANGES if any AC are unmet or there is a blocking issue
- COMMENT if you are unsure
\`\`\`

---

> ℹ️ **Note:** This comment was posted automatically when the \`agent:review\` label was applied. The Copilot coding agent does **not** run automatically – a human must start it using the prompt above.
`;

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
};
