# GitLab MCP Server

一個功能強大的 GitLab MCP (Model Context Protocol) 伺服器，提供與 GitLab API 的完整整合，並支援 Sentry 錯誤追蹤整合。

## 功能特色

### 🚀 GitLab 核心功能
- **專案管理**：列出、查看和管理 GitLab 專案
- **提交歷史**：查看和分析 Git 提交記錄
- **CI/CD 流水線**：監控和分析 Pipeline 狀態
- **問題管理**：創建、更新和查看 Issues
- **合併請求**：管理 Merge Request 生命週期
- **程式碼分析**：分析提交變更和程式碼差異

### 🔗 Sentry 整合
- **錯誤監控**：直接從 Sentry 獲取錯誤資訊
- **自動化修復**：從 Sentry 錯誤自動創建 GitLab Issue
- **智能 MR 生成**：為錯誤修復自動創建 Merge Request
- **程式碼分析**：AI 驅動的錯誤分析和修復建議

### 🤖 AI 增強功能
- **智能程式碼分析**：使用 AI 分析程式碼變更
- **修復建議**：基於錯誤類型提供修復建議
- **自動化工作流**：從錯誤發現到修復的完整自動化流程

## 安裝和設定

### 1. 克隆專案
\`\`\`bash
git clone <repository-url>
cd gitlab-mcp
\`\`\`

### 2. 安裝依賴
\`\`\`bash
npm install
# 或
yarn install
\`\`\`

### 3. 環境配置
在你的 \`~/.zshrc\` 文件中設定環境變數：

#### 必要配置
\`\`\`bash
# GitLab 配置
export GITLAB_BASE_URL="https://gitlab.com"
export GITLAB_ACCESS_TOKEN="your_gitlab_access_token"
\`\`\`

#### 可選配置 (Sentry 整合)
\`\`\`bash
# Sentry 配置
export SENTRY_URL="https://sentry.io"
export SENTRY_ORG_SLUG="your_sentry_org_slug"
export SENTRY_PROJECT="your_sentry_project"
export SENTRY_AUTH_TOKEN="your_sentry_auth_token"
\`\`\`

#### 可選配置 (AI 功能)
\`\`\`bash
# AI 配置
export OPENAI_API_KEY="your_openai_api_key"
export ANTHROPIC_API_KEY="your_anthropic_api_key"
\`\`\`

設定完成後，重新載入環境變數：
\`\`\`bash
source ~/.zshrc
\`\`\`

### 4. 編譯和啟動
\`\`\`bash
# 編譯
npm run build

# 開發模式
npm run dev

# 生產模式
npm start
\`\`\`

### 5. Claude 配置
在你的 Claude 設定中加入此 MCP 伺服器：

\`\`\`json
{
  "mcpServers": {
    "gitlab-mcp": {
      "command": "yarn",
      "args": ["dev"],
      "cwd": "/path/to/gitlab-mcp"
    }
  }
}
\`\`\`

## 使用指南

### GitLab 基本操作

#### 列出專案
\`\`\`
使用 gitlab_get_projects 工具列出您的 GitLab 專案
\`\`\`

#### 查看提交歷史
\`\`\`
使用 gitlab_get_commits 工具查看專案的提交歷史
參數：
- projectId: 專案 ID 或路徑
- ref_name: 分支名稱 (可選)
- since/until: 時間範圍 (可選)
\`\`\`

#### 監控 CI/CD 流水線
\`\`\`
使用 gitlab_get_pipelines 工具查看流水線狀態
使用 gitlab_get_pipeline_jobs 工具查看具體任務
\`\`\`

#### 管理 Issues 和 MR
\`\`\`
使用 gitlab_create_issue 創建新問題
使用 gitlab_create_merge_request 創建合併請求
\`\`\`

### Sentry 整合操作

#### 查看 Sentry 錯誤
\`\`\`
使用 sentry_get_issues 工具獲取錯誤列表
使用 sentry_get_issue 工具查看特定錯誤詳情
\`\`\`

#### 自動化修復流程
\`\`\`
1. 使用 sentry_create_gitlab_issue 從 Sentry 錯誤創建 GitLab Issue
2. 使用 sentry_analyze_issue 分析錯誤並獲取修復建議
3. 使用 sentry_create_fix_mr 為修復創建 Merge Request
\`\`\`

### 程式碼分析功能

#### 分析提交變更
\`\`\`
使用 gitlab_analyze_commit_changes 工具分析提交的程式碼變更
支援 AI 分析選項，提供更深入的程式碼洞察
\`\`\`

## 獲取 API Token

### GitLab Access Token
1. 登入 GitLab
2. 前往 User Settings > Access Tokens
3. 創建新的 Personal Access Token
4. 選擇必要的權限：
   - \`read_api\`
   - \`read_repository\`
   - \`write_repository\`
   - \`read_user\`

### Sentry Auth Token
1. 登入 Sentry
2. 前往 Settings > Auth Tokens
3. 創建新的 Auth Token
4. 選擇必要的權限：
   - \`event:read\`
   - \`issue:read\`
   - \`issue:write\`
   - \`project:read\`

## 支援的工具

### GitLab 工具
- \`gitlab_get_projects\` - 獲取專案列表
- \`gitlab_get_project\` - 獲取專案詳情
- \`gitlab_get_commits\` - 獲取提交歷史
- \`gitlab_get_commit\` - 獲取提交詳情
- \`gitlab_get_commit_diff\` - 獲取提交差異
- \`gitlab_get_pipelines\` - 獲取流水線列表
- \`gitlab_get_pipeline\` - 獲取流水線詳情
- \`gitlab_get_pipeline_jobs\` - 獲取流水線任務
- \`gitlab_get_job_log\` - 獲取任務日誌
- \`gitlab_get_issues\` - 獲取問題列表
- \`gitlab_get_issue\` - 獲取問題詳情
- \`gitlab_create_issue\` - 創建新問題
- \`gitlab_get_merge_requests\` - 獲取合併請求列表
- \`gitlab_get_merge_request\` - 獲取合併請求詳情
- \`gitlab_create_merge_request\` - 創建合併請求
- \`gitlab_get_mr_changes\` - 獲取合併請求變更
- \`gitlab_analyze_commit_changes\` - 分析提交變更

### Sentry 整合工具
- \`sentry_get_issues\` - 獲取 Sentry 問題列表
- \`sentry_get_issue\` - 獲取 Sentry 問題詳情
- \`sentry_create_gitlab_issue\` - 從 Sentry 錯誤創建 GitLab 問題
- \`sentry_create_fix_mr\` - 創建修復用的合併請求
- \`sentry_analyze_issue\` - 分析 Sentry 問題並生成修復建議

## 範例使用案例

### 自動化錯誤修復流程
\`\`\`
1. 監控 Sentry 錯誤 → sentry_get_issues
2. 分析特定錯誤 → sentry_analyze_issue
3. 創建 GitLab Issue → sentry_create_gitlab_issue
4. 創建修復分支和 MR → sentry_create_fix_mr
5. 程式碼審查和合併
\`\`\`

### CI/CD 流水線監控
\`\`\`
1. 查看最近的流水線 → gitlab_get_pipelines
2. 檢查失敗的任務 → gitlab_get_pipeline_jobs
3. 分析失敗日誌 → gitlab_get_job_log
4. 創建修復 Issue → gitlab_create_issue
\`\`\`

### 程式碼審查自動化
\`\`\`
1. 查看最近的提交 → gitlab_get_commits
2. 分析程式碼變更 → gitlab_analyze_commit_changes
3. 檢查相關的 MR → gitlab_get_merge_requests
4. 提供審查建議和回饋
\`\`\`

## 故障排除

### 常見問題

1. **GitLab API 連接失敗**
   - 檢查 \`GITLAB_BASE_URL\` 和 \`GITLAB_ACCESS_TOKEN\` 是否正確
   - 確認 Token 有足夠的權限

2. **Sentry 整合不工作**
   - 確認所有 Sentry 環境變數都已設定
   - 檢查 Sentry Auth Token 的權限

3. **MCP 伺服器無法啟動**
   - 檢查 Node.js 版本 (建議 Node.js 18+)
   - 確認所有依賴都已安裝

### 日誌和偵錯
伺服器啟動時會在 stderr 輸出日誌：
\`\`\`
GitLab MCP server 已啟動
\`\`\`

## 貢獻指南

歡迎貢獻！請：
1. Fork 此專案
2. 創建功能分支
3. 提交您的變更
4. 創建 Pull Request

## 授權條款

MIT License - 詳見 LICENSE 文件