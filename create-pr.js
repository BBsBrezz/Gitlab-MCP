#!/usr/bin/env node

import axios from 'axios';

const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
const OWNER = 'BBsBrezz';
const REPO = 'Gitlab-MCP';

const client = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

async function createPR() {
  try {
    console.log('🚀 創建 Pull Request...\n');

    const prData = {
      title: '🔄 feat: Migrate from GitLab to GitHub MCP Integration',
      head: 'feature/migrate-to-github',
      base: 'master',
      body: `## 📝 Summary

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

## 🧪 Testing

All tests passed successfully:
- ✅ GitHub API connection
- ✅ User authentication
- ✅ Repository operations
- ✅ Commits and workflow runs
- ✅ Issues and Pull Requests

## 📚 Documentation

- Updated README.md with GitHub setup instructions
- Added VERIFICATION.md for testing guide
- Updated .env.example with GitHub configuration

## 🔐 Breaking Changes

⚠️ This is a **complete migration** from GitLab to GitHub:
- All GitLab-related code has been removed
- Environment variables changed from \`GITLAB_*\` to \`GITHUB_*\`
- Tool names changed from \`gitlab_*\` to \`github_*\`

## 🎉 Ready for Review

The MCP server is fully functional and ready for production use with GitHub.

---

🤖 Generated with Claude Code
`,
      draft: false,
    };

    const response = await client.post(`/repos/${OWNER}/${REPO}/pulls`, prData);
    const pr = response.data;

    console.log('✅ Pull Request 創建成功!\n');
    console.log(`📋 PR #${pr.number}: ${pr.title}`);
    console.log(`🔗 URL: ${pr.html_url}`);
    console.log(`📊 狀態: ${pr.state}`);
    console.log(`🌿 分支: ${pr.head.ref} → ${pr.base.ref}`);
    console.log(`👤 作者: ${pr.user.login}`);
    console.log('');

    return pr;
  } catch (error) {
    if (error.response) {
      console.error('❌ 創建 PR 失敗:', error.response.data.message);
      if (error.response.data.errors) {
        console.error('詳細錯誤:', error.response.data.errors);
      }
    } else {
      console.error('❌ 錯誤:', error.message);
    }
    process.exit(1);
  }
}

createPR();
