#!/usr/bin/env node

import { GitLabClient } from './dist/gitlab-client.js';
import { SentryIntegration } from './dist/sentry-integration.js';
import { config } from './dist/config.js';

console.log('🔧 測試 GitLab MCP 連接...\n');

async function testGitLabConnection() {
  try {
    console.log('📋 測試 GitLab 連接...');
    const client = new GitLabClient();
    
    // 測試獲取用戶資訊
    const user = await client.getUser();
    console.log(`✅ GitLab 連接成功！`);
    console.log(`   用戶: ${user.name} (${user.username})`);
    console.log(`   Email: ${user.email}`);
    
    // 測試獲取專案
    const projects = await client.getProjects({ per_page: 5 });
    console.log(`   找到 ${projects.length} 個專案`);
    
    return true;
  } catch (error) {
    console.error('❌ GitLab 連接失敗:', error.message);
    return false;
  }
}

async function testSentryIntegration() {
  try {
    if (!config.sentryAuthToken || !config.sentryOrgSlug || !config.sentryProject) {
      console.log('⚠️  Sentry 整合未配置 (可選)');
      return true;
    }
    
    console.log('🔍 測試 Sentry 整合...');
    const gitlabClient = new GitLabClient();
    const sentryIntegration = new SentryIntegration(gitlabClient);
    
    // 測試獲取 Sentry 問題
    const issues = await sentryIntegration.getSentryIssues({ limit: 5 });
    console.log(`✅ Sentry 整合成功！`);
    console.log(`   找到 ${issues.length} 個問題`);
    
    return true;
  } catch (error) {
    console.error('❌ Sentry 整合失敗:', error.message);
    return false;
  }
}

async function main() {
  console.log('環境變數檢查:');
  console.log(`  GITLAB_BASE_URL: ${config.gitlabBaseUrl}`);
  console.log(`  GITLAB_ACCESS_TOKEN: ${config.gitlabAccessToken ? '已設定' : '未設定'}`);
  console.log(`  SENTRY_URL: ${config.sentryUrl || '未設定'}`);
  console.log(`  SENTRY_ORG_SLUG: ${config.sentryOrgSlug || '未設定'}`);
  console.log(`  SENTRY_PROJECT: ${config.sentryProject || '未設定'}`);
  console.log(`  SENTRY_AUTH_TOKEN: ${config.sentryAuthToken ? '已設定' : '未設定'}`);
  console.log('');
  
  const gitlabOk = await testGitLabConnection();
  console.log('');
  const sentryOk = await testSentryIntegration();
  
  console.log('\n📊 測試結果:');
  console.log(`  GitLab 連接: ${gitlabOk ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`  Sentry 整合: ${sentryOk ? '✅ 成功' : '❌ 失敗'}`);
  
  if (gitlabOk) {
    console.log('\n🎉 GitLab MCP 伺服器已準備就緒！');
    console.log('   可以重新啟動 Claude 來使用新的 MCP 工具。');
  } else {
    console.log('\n🚨 請檢查您的配置並重試。');
    process.exit(1);
  }
}

main().catch(console.error);