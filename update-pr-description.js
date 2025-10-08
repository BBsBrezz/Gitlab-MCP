#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
const OWNER = 'BBsBrezz';
const REPO = 'Gitlab-MCP';
const PR_NUMBER = 1;

const client = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

async function updatePRDescription() {
  try {
    console.log('📝 更新 PR 描述...\n');

    // Read TEST_RESULTS.md
    const testResults = fs.readFileSync('TEST_RESULTS.md', 'utf-8');

    // Create new PR body with original description + test results
    const newBody = `## 📝 Summary

This PR migrates the entire MCP server from GitLab integration to GitHub integration.

## 🎯 Changes

### Core Changes
- ✅ **Replaced GitLabClient with GitHubClient**
  - Complete rewrite using GitHub REST API v4
  - Support for repositories, commits, workflows, issues, and PRs

- ✅ **Updated Type Definitions**
  - GitLabProject → GitHubRepository
  - GitLabMergeRequest → GitHubPullRequest
  - GitLabPipeline → GitHubWorkflowRun

- ✅ **Migrated All Tools**
  - \`gitlab_*\` → \`github_*\`
  - 20+ tools fully migrated

### New Features
- ✅ **GitHub Actions Support**
  - View workflow runs
  - Check job status
  - Read job logs

- ✅ **Enhanced PR Features**
  - View PR file changes
  - Read and create comments
  - Full PR lifecycle management

- ✅ **Testing & Documentation**
  - Automated test suite (\`test-github-connection.js\`)
  - Comprehensive verification guide (\`VERIFICATION.md\`)
  - Updated README with GitHub-specific instructions

## 🔐 Breaking Changes

⚠️ This is a **complete migration** from GitLab to GitHub:
- All GitLab-related code has been removed
- Environment variables changed from \`GITLAB_*\` to \`GITHUB_*\`
- Tool names changed from \`gitlab_*\` to \`github_*\`

---

${testResults}

---

🤖 Generated with Claude Code
`;

    const response = await client.patch(`/repos/${OWNER}/${REPO}/pulls/${PR_NUMBER}`, {
      body: newBody
    });

    console.log('✅ PR 描述更新成功!\n');
    console.log(`📋 PR #${response.data.number}: ${response.data.title}`);
    console.log(`🔗 URL: ${response.data.html_url}`);
    console.log('\n📊 測試報告已添加到 PR 描述中，reviewer 現在可以直接查看所有測試結果！');

  } catch (error) {
    if (error.response) {
      console.error('❌ 更新 PR 描述失敗:', error.response.data.message);
      if (error.response.data.errors) {
        console.error('詳細錯誤:', error.response.data.errors);
      }
    } else {
      console.error('❌ 錯誤:', error.message);
    }
    process.exit(1);
  }
}

updatePRDescription();
