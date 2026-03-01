// Script: agent-auto-pr.js
// Creates a branch and opens a PR when the 'agent:build-pr' label is applied to an issue.
module.exports = async ({ github, context }) => {
  const BASE_BRANCH = 'master';
  const issueNumber = context.issue.number;
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // Fetch the issue details
  const { data: issue } = await github.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });

  // Build a URL-safe slug from the issue title
  const slug = issue.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  const branchName = `agent/issue-${issueNumber}-${slug}`;

  // Get the SHA of the base branch to use as the base for the new branch
  const { data: masterRef } = await github.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${BASE_BRANCH}`,
  });
  const sha = masterRef.object.sha;

  // Create the branch (skip if it already exists)
  try {
    await github.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha,
    });
    console.log(`Branch created: ${branchName}`);
  } catch (err) {
    if (err.status === 422 && err.message && err.message.includes('Reference already exists')) {
      console.log(`Branch already exists: ${branchName} – skipping creation.`);
    } else {
      throw err;
    }
  }

  // Guard: avoid opening a duplicate PR for the same branch
  const { data: existingPRs } = await github.rest.pulls.list({
    owner,
    repo,
    head: `${owner}:${branchName}`,
    state: 'open',
  });
  if (existingPRs.length > 0) {
    console.log(`PR already open for branch ${branchName} – skipping.`);
    return;
  }

  const prBody = `## Linked Issue

Closes #${issueNumber}

## Summary

<!-- Describe what this PR does and why. -->

## Acceptance Criteria Checklist

<!-- Copy the AC from the linked issue and check each item off. -->

- [ ] AC1:
- [ ] AC2:

## Test Evidence

<!-- Paste test output, screenshots, or other evidence that the AC are met. -->

\`\`\`
# go test ./... output or other evidence
\`\`\`

## Risk & Roll-back

<!-- Describe any risks introduced and how to roll back if needed. -->

- **Risk:** <!-- e.g., none / performance impact / breaking change -->
- **Roll-back:** <!-- e.g., revert this PR / feature flag off -->
`;

  const { data: pr } = await github.rest.pulls.create({
    owner,
    repo,
    title: `[Agent] ${issue.title}`,
    head: branchName,
    base: BASE_BRANCH,
    body: prBody,
  });
  console.log(`PR created: ${pr.html_url}`);
};
