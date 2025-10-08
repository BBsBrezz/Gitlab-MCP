#!/usr/bin/env node

/**
 * GitHub MCP 連接測試腳本
 * 用於驗證 GitHub API 連接和基本功能
 */

import axios from 'axios';

// 從環境變數讀取配置
const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
const GITHUB_API = 'https://api.github.com';

if (!GITHUB_TOKEN) {
  console.error('❌ 錯誤: 未設定 GITHUB_ACCESS_TOKEN 環境變數');
  console.log('\n請先設定環境變數:');
  console.log('export GITHUB_ACCESS_TOKEN="your_github_token"');
  process.exit(1);
}

// 創建 GitHub API 客戶端
const client = axios.create({
  baseURL: GITHUB_API,
  headers: {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

async function testConnection() {
  console.log('🔍 測試 GitHub API 連接...\n');

  try {
    // 1. 測試用戶資訊
    console.log('1️⃣ 測試獲取用戶資訊...');
    const userResponse = await client.get('/user');
    const user = userResponse.data;
    console.log(`✅ 成功! 當前用戶: ${user.login} (${user.name || 'N/A'})`);
    console.log(`   Email: ${user.email || 'N/A'}`);
    console.log(`   Public Repos: ${user.public_repos}`);
    console.log('');

    // 2. 測試獲取倉庫列表
    console.log('2️⃣ 測試獲取倉庫列表...');
    const reposResponse = await client.get('/user/repos', {
      params: { per_page: 5, sort: 'updated' }
    });
    const repos = reposResponse.data;
    console.log(`✅ 成功! 找到 ${repos.length} 個最近更新的倉庫:`);
    repos.forEach(repo => {
      console.log(`   - ${repo.full_name} (⭐ ${repo.stargazers_count})`);
    });
    console.log('');

    if (repos.length === 0) {
      console.log('⚠️  你沒有任何倉庫，後續測試將跳過');
      return;
    }

    const testRepo = repos[0];
    console.log(`📦 使用倉庫 "${testRepo.full_name}" 進行後續測試\n`);

    // 3. 測試獲取提交歷史
    console.log('3️⃣ 測試獲取提交歷史...');
    try {
      const commitsResponse = await client.get(`/repos/${testRepo.full_name}/commits`, {
        params: { per_page: 3 }
      });
      const commits = commitsResponse.data;
      console.log(`✅ 成功! 找到 ${commits.length} 個最近的提交:`);
      commits.forEach(commit => {
        const message = commit.commit.message.split('\n')[0];
        const author = commit.commit.author.name;
        console.log(`   - ${commit.sha.substring(0, 7)}: ${message} (by ${author})`);
      });
    } catch (error) {
      console.log(`⚠️  跳過 (倉庫可能是空的): ${error.response?.status}`);
    }
    console.log('');

    // 4. 測試獲取 Issues
    console.log('4️⃣ 測試獲取 Issues...');
    try {
      const issuesResponse = await client.get(`/repos/${testRepo.full_name}/issues`, {
        params: { state: 'all', per_page: 3 }
      });
      const issues = issuesResponse.data.filter(issue => !issue.pull_request);
      console.log(`✅ 成功! 找到 ${issues.length} 個 Issues:`);
      issues.forEach(issue => {
        console.log(`   - #${issue.number}: ${issue.title} (${issue.state})`);
      });
    } catch (error) {
      console.log(`⚠️  跳過 (可能 Issues 未啟用): ${error.response?.status}`);
    }
    console.log('');

    // 5. 測試獲取 Pull Requests
    console.log('5️⃣ 測試獲取 Pull Requests...');
    try {
      const prsResponse = await client.get(`/repos/${testRepo.full_name}/pulls`, {
        params: { state: 'all', per_page: 3 }
      });
      const prs = prsResponse.data;
      console.log(`✅ 成功! 找到 ${prs.length} 個 Pull Requests:`);
      prs.forEach(pr => {
        console.log(`   - #${pr.number}: ${pr.title} (${pr.state})`);
      });
    } catch (error) {
      console.log(`⚠️  跳過: ${error.response?.status}`);
    }
    console.log('');

    // 6. 測試獲取 GitHub Actions Workflows
    console.log('6️⃣ 測試獲取 GitHub Actions...');
    try {
      const workflowsResponse = await client.get(`/repos/${testRepo.full_name}/actions/runs`, {
        params: { per_page: 3 }
      });
      const runs = workflowsResponse.data.workflow_runs;
      console.log(`✅ 成功! 找到 ${runs.length} 個 Workflow 運行:`);
      runs.forEach(run => {
        console.log(`   - ${run.name}: ${run.status} (${run.conclusion || 'N/A'})`);
      });
    } catch (error) {
      console.log(`⚠️  跳過 (可能沒有 Actions): ${error.response?.status}`);
    }
    console.log('');

    // 7. 測試 API 速率限制
    console.log('7️⃣ 檢查 API 速率限制...');
    const rateLimitResponse = await client.get('/rate_limit');
    const rateLimit = rateLimitResponse.data.rate;
    const resetTime = new Date(rateLimit.reset * 1000).toLocaleString();
    console.log(`✅ API 速率限制狀態:`);
    console.log(`   已使用: ${rateLimit.used}/${rateLimit.limit}`);
    console.log(`   剩餘: ${rateLimit.remaining}`);
    console.log(`   重置時間: ${resetTime}`);
    console.log('');

    // 測試總結
    console.log('═══════════════════════════════════════');
    console.log('✅ 所有測試完成!');
    console.log('═══════════════════════════════════════');
    console.log('\n你的 GitHub MCP 伺服器已準備就緒! 🎉\n');
    console.log('下一步:');
    console.log('1. 編譯專案: npm run build');
    console.log('2. 啟動伺服器: npm run dev');
    console.log('3. 在 Claude 中配置 MCP 伺服器');

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    if (error.response) {
      console.error(`HTTP 狀態碼: ${error.response.status}`);
      console.error(`錯誤訊息: ${error.response.data.message || '未知錯誤'}`);
    }
    process.exit(1);
  }
}

// 執行測試
console.log('═══════════════════════════════════════');
console.log('  GitHub MCP 連接測試');
console.log('═══════════════════════════════════════\n');

testConnection().catch(error => {
  console.error('測試過程中發生錯誤:', error);
  process.exit(1);
});
