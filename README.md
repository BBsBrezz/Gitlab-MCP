# GitHub MCP Server

一個功能強大的 GitHub MCP (Model Context Protocol) 伺服器,提供與 GitHub API 的完整整合。

## 功能特色

### 🚀 GitHub 核心功能
- **倉庫管理**:列出、查看和管理 GitHub 倉庫
- **提交歷史**:查看和分析 Git 提交記錄
- **GitHub Actions**:監控和分析 Workflow 運行狀態
- **問題管理**:創建、更新和查看 Issues
- **Pull Request**:管理 PR 生命週期
- **評論功能**:在 Issues 和 PR 中發表評論
- **文件讀取**:讀取倉庫中的文件內容

## 安裝和設定

### 1. 克隆專案
```bash
git clone <repository-url>
cd github-mcp
```

### 2. 安裝依賴
```bash
npm install
# 或
yarn install
```

### 3. 環境配置

#### 方式一:環境變數
在你的 `~/.zshrc` 或 `~/.bashrc` 文件中設定環境變數:

```bash
# GitHub 配置
export GITHUB_ACCESS_TOKEN="your_github_access_token"
```

設定完成後,重新載入環境變數:
```bash
source ~/.zshrc  # 或 source ~/.bashrc
```

#### 方式二:使用 .env 文件
複製 `.env.example` 為 `.env`:
```bash
cp .env.example .env
```

編輯 `.env` 文件並填入你的 GitHub Access Token:
```
GITHUB_ACCESS_TOKEN=your_github_access_token
```

### 4. 編譯和啟動
```bash
# 編譯
npm run build

# 開發模式
npm run dev

# 生產模式
npm start
```

### 5. Claude 配置
在你的 Claude 設定中加入此 MCP 伺服器:

```json
{
  "mcpServers": {
    "github-mcp": {
      "command": "yarn",
      "args": ["dev"],
      "cwd": "/path/to/github-mcp"
    }
  }
}
```

## 使用指南

### GitHub 基本操作

#### 列出倉庫
```
使用 github_get_repositories 工具列出您的 GitHub 倉庫
```

#### 查看提交歷史
```
使用 github_get_commits 工具查看倉庫的提交歷史
參數:
- repository: 倉庫標識 (格式: owner/repo)
- sha: 分支名稱 (可選)
- since/until: 時間範圍 (可選)
```

#### 監控 GitHub Actions
```
使用 github_get_workflow_runs 工具查看工作流運行狀態
使用 github_get_workflow_run_jobs 工具查看具體任務
```

#### 管理 Issues 和 PR
```
使用 github_create_issue 創建新問題
使用 github_create_pull_request 創建 Pull Request
```

#### 評論功能
```
使用 github_create_pr_comment 在 PR 中發表評論
使用 github_create_issue_comment 在 Issue 中發表評論
```

## 獲取 GitHub Access Token

1. 登入 GitHub
2. 前往 Settings > Developer settings > Personal access tokens > Tokens (classic)
3. 點擊 "Generate new token (classic)"
4. 選擇必要的權限:
   - `repo` - 完整的倉庫控制權限
   - `workflow` - 更新 GitHub Actions 工作流
   - `read:org` - 讀取組織和團隊成員資訊
   - `write:discussion` - 讀寫討論
5. 生成並複製 Token

## 支援的工具

### 倉庫操作
- `github_get_repositories` - 獲取倉庫列表
- `github_get_repository` - 獲取倉庫詳情
- `github_get_file_content` - 讀取文件內容

### 提交操作
- `github_get_commits` - 獲取提交歷史
- `github_get_commit` - 獲取提交詳情

### GitHub Actions
- `github_get_workflow_runs` - 獲取工作流運行列表
- `github_get_workflow_run` - 獲取工作流運行詳情
- `github_get_workflow_run_jobs` - 獲取工作流任務
- `github_get_job_logs` - 獲取任務日誌

### Issues
- `github_get_issues` - 獲取問題列表
- `github_get_issue` - 獲取問題詳情
- `github_create_issue` - 創建新問題
- `github_get_issue_comments` - 獲取問題評論
- `github_create_issue_comment` - 發表問題評論

### Pull Requests
- `github_get_pull_requests` - 獲取 PR 列表
- `github_get_pull_request` - 獲取 PR 詳情
- `github_create_pull_request` - 創建 PR
- `github_get_pr_files` - 獲取 PR 文件變更
- `github_get_pr_comments` - 獲取 PR 評論
- `github_create_pr_comment` - 發表 PR 評論

## 範例使用案例

### CI/CD 監控
```
1. 查看最近的工作流運行 → github_get_workflow_runs
2. 檢查失敗的任務 → github_get_workflow_run_jobs
3. 分析失敗日誌 → github_get_job_logs
4. 創建修復 Issue → github_create_issue
```

### Pull Request 工作流
```
1. 查看最近的 PR → github_get_pull_requests
2. 檢查特定 PR → github_get_pull_request
3. 查看文件變更 → github_get_pr_files
4. 添加評論回饋 → github_create_pr_comment
```

### Issue 管理
```
1. 查看開放的 Issues → github_get_issues
2. 查看特定 Issue → github_get_issue
3. 創建新 Issue → github_create_issue
4. 添加評論 → github_create_issue_comment
```

## 故障排除

### 常見問題

1. **GitHub API 連接失敗**
   - 檢查 `GITHUB_ACCESS_TOKEN` 是否正確
   - 確認 Token 有足夠的權限
   - 檢查網絡連接

2. **API 速率限制**
   - GitHub API 有速率限制
   - 認證用戶:每小時 5000 次請求
   - 未認證用戶:每小時 60 次請求

3. **MCP 伺服器無法啟動**
   - 檢查 Node.js 版本 (建議 Node.js 18+)
   - 確認所有依賴都已安裝
   - 查看錯誤日誌

### 日誌和偵錯
伺服器啟動時會在 stderr 輸出日誌:
```
GitHub MCP server 已啟動
```

## 倉庫標識格式

所有需要指定倉庫的操作都使用 `owner/repo` 格式,例如:
- `octocat/Hello-World`
- `facebook/react`
- `microsoft/vscode`

## 貢獻指南

歡迎貢獻!請:
1. Fork 此專案
2. 創建功能分支
3. 提交您的變更
4. 創建 Pull Request

## 授權條款

MIT License - 詳見 LICENSE 文件
