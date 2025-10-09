#!/usr/bin/env node

/**
 * AI Code Reviewer using Claude API
 *
 * This script:
 * 1. Uses MCP GitHubClient to fetch PR data (files, comments, diff)
 * 2. Sends data to Claude API for intelligent analysis
 * 3. Posts AI-generated review comments to the PR
 */

import Anthropic from '@anthropic-ai/sdk';
import { GitHubClient } from './dist/github-client.js';

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY; // e.g., "BBsBrezz/Gitlab-MCP"
const PR_NUMBER = parseInt(process.env.PR_NUMBER);

if (!CLAUDE_API_KEY) {
  console.error('❌ 錯誤: 需要設置 ANTHROPIC_API_KEY 環境變數');
  process.exit(1);
}

if (!GITHUB_TOKEN) {
  console.error('❌ 錯誤: 需要設置 GITHUB_ACCESS_TOKEN 環境變數');
  process.exit(1);
}

if (!REPO || !PR_NUMBER) {
  console.error('❌ 錯誤: 需要設置 GITHUB_REPOSITORY 和 PR_NUMBER');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

const githubClient = new GitHubClient();

/**
 * 獲取 PR 的完整資訊
 */
async function fetchPRData() {
  console.log('📥 獲取 PR 資訊...\n');

  try {
    // 1. 獲取 PR 基本資訊
    const pr = await githubClient.getPullRequest(REPO, PR_NUMBER);
    console.log(`✅ PR #${pr.number}: ${pr.title}`);
    console.log(`   作者: ${pr.user.login}`);
    console.log(`   分支: ${pr.head.ref} → ${pr.base.ref}`);
    console.log(`   變更: +${pr.additions} -${pr.deletions} (${pr.changed_files} 個文件)\n`);

    // 2. 獲取文件變更
    const files = await githubClient.getPullRequestFiles(REPO, PR_NUMBER);
    console.log(`✅ 獲取 ${files.length} 個變更文件\n`);

    // 3. 獲取現有評論
    const comments = await githubClient.getPullRequestComments(REPO, PR_NUMBER);
    console.log(`✅ 獲取 ${comments.length} 則現有評論\n`);

    return { pr, files, comments };
  } catch (error) {
    console.error('❌ 獲取 PR 資訊失敗:', error.message);
    throw error;
  }
}

/**
 * 構建給 Claude 的 prompt
 */
function buildPrompt(prData) {
  const { pr, files, comments } = prData;

  // 整理文件變更資訊
  const filesInfo = files.map(file => {
    return `
### 文件: ${file.filename}
**狀態**: ${file.status}
**變更**: +${file.additions} -${file.deletions}
**補丁 (patch)**:
\`\`\`diff
${file.patch || '(二進制文件或無補丁)'}
\`\`\`
`;
  }).join('\n---\n');

  // 整理現有評論
  const commentsInfo = comments.length > 0
    ? comments.map(c => `- ${c.user.login}: ${c.body}`).join('\n')
    : '(目前沒有評論)';

  return `你是一位資深的程式碼審查專家。請仔細分析以下 Pull Request 的變更內容，並提供專業的程式碼審查建議。

## PR 基本資訊

**標題**: ${pr.title}
**描述**:
${pr.body || '(無描述)'}

**作者**: ${pr.user.login}
**分支**: ${pr.head.ref} → ${pr.base.ref}
**變更統計**: +${pr.additions} -${pr.deletions} (${pr.changed_files} 個文件)

---

## 文件變更詳情

${filesInfo}

---

## 現有評論

${commentsInfo}

---

## 請你提供以下方面的審查：

1. **程式碼品質** 🎯
   - 程式碼可讀性和維護性
   - 命名規範
   - 程式碼結構和組織

2. **潛在問題** 🐛
   - 邏輯錯誤
   - 邊界條件處理
   - 錯誤處理

3. **安全性** 🔒
   - 潛在的安全漏洞
   - 敏感資訊處理
   - 輸入驗證

4. **性能** ⚡
   - 性能瓶頸
   - 不必要的重複計算
   - 資源使用優化

5. **測試** 🧪
   - 測試覆蓋率
   - 測試品質
   - 缺失的測試案例

6. **最佳實踐** 📚
   - 是否遵循專案慣例
   - 現代化的寫法建議
   - 設計模式應用

7. **文檔** 📖
   - 註釋完整性
   - API 文檔
   - README 更新需求

請以清晰、建設性的方式提供反饋。對於好的實踐給予肯定，對於需要改進的地方給出具體建議。

使用 Markdown 格式，包含表情符號使評論更易讀。`;
}

/**
 * 使用 Claude API 分析程式碼
 */
async function analyzeWithClaude(prompt) {
  console.log('🤖 Claude AI 正在分析程式碼...\n');

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022', // 最新的 Claude 3.5 Sonnet
      max_tokens: 4096,
      temperature: 0.3, // 較低的溫度以獲得更一致的輸出
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const review = message.content[0].text;
    console.log('✅ AI 分析完成\n');

    return review;
  } catch (error) {
    console.error('❌ Claude API 調用失敗:', error.message);
    throw error;
  }
}

/**
 * 發布 AI 評論到 PR
 */
async function postReview(review) {
  console.log('📝 發布 AI 評論到 PR...\n');

  const commentBody = `## 🤖 AI Code Review by Claude

${review}

---

**審查模型**: Claude 3.5 Sonnet
**審查時間**: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
**自動化工具**: GitHub MCP + Claude API

💡 這是 AI 自動生成的程式碼審查，建議結合人工審查一起參考。
`;

  try {
    const comment = await githubClient.createPullRequestComment(REPO, PR_NUMBER, {
      body: commentBody
    });

    console.log(`✅ AI 評論已發布!`);
    console.log(`   評論 ID: ${comment.id}`);
    console.log(`   URL: ${comment.html_url}\n`);

    return comment;
  } catch (error) {
    console.error('❌ 發布評論失敗:', error.message);
    throw error;
  }
}

/**
 * 主函數
 */
async function main() {
  console.log('🚀 AI Code Review Agent 啟動\n');
  console.log(`📋 倉庫: ${REPO}`);
  console.log(`🔢 PR: #${PR_NUMBER}\n`);
  console.log('═══════════════════════════════════════\n');

  try {
    // 1. 獲取 PR 資料
    const prData = await fetchPRData();

    // 2. 構建 prompt
    const prompt = buildPrompt(prData);

    // 3. Claude 分析
    const review = await analyzeWithClaude(prompt);

    // 4. 發布評論
    await postReview(review);

    console.log('═══════════════════════════════════════');
    console.log('✅ AI Code Review 完成!\n');

    // 輸出審查預覽（用於 GitHub Actions logs）
    console.log('📄 審查內容預覽:');
    console.log('---');
    console.log(review.substring(0, 500) + '...\n');

  } catch (error) {
    console.error('\n❌ AI Code Review 失敗:', error);
    process.exit(1);
  }
}

// 執行
main();
