#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs';

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

async function createVerificationPR() {
  try {
    console.log('🚀 創建驗證 PR...\n');

    // Read TEST_RESULTS.md for the body
    const testResults = fs.readFileSync('TEST_RESULTS.md', 'utf-8');

    const prData = {
      title: '📋 docs: Add PR Description Template and Update Script',
      head: 'feature/verify-pr-description',
      base: 'master',
      body: `## 📝 Summary

This PR adds tools for managing PR descriptions with comprehensive test results.

## 🎯 Changes

### New Files
- ✅ **PR_DESCRIPTION.md**
  - Complete PR description template
  - Includes all test results from TEST_RESULTS.md
  - Ready to copy-paste into PR descriptions

- ✅ **update-pr-description.js**
  - Automated script to update PR descriptions via GitHub API
  - Combines original PR description with test results
  - Makes test results visible directly in PR interface

## 💡 Purpose

This allows reviewers to see complete test results and validation data directly in the PR description, without needing to open separate files. Everything is visible at a glance when reviewing whether to merge.

## 🧪 Usage

\`\`\`bash
# Update any PR description with test results
GITHUB_ACCESS_TOKEN="your_token" node update-pr-description.js
\`\`\`

Or manually copy content from PR_DESCRIPTION.md to any PR.

---

${testResults}

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
`,
      draft: false,
    };

    const response = await client.post(`/repos/${OWNER}/${REPO}/pulls`, prData);
    const pr = response.data;

    console.log('✅ PR 創建成功!\n');
    console.log(`📋 PR #${pr.number}: ${pr.title}`);
    console.log(`🔗 URL: ${pr.html_url}`);
    console.log(`📊 狀態: ${pr.state}`);
    console.log(`🌿 分支: ${pr.head.ref} → ${pr.base.ref}`);
    console.log(`👤 作者: ${pr.user.login}`);
    console.log('');
    console.log('🎉 這個 PR 的描述包含完整的測試報告，可以直接驗證格式！');
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

createVerificationPR();
