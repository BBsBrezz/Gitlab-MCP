# GitHub MCP 功能驗證指南

## 步驟 1: 準備環境

### 1.1 獲取 GitHub Personal Access Token

1. 登入 GitHub
2. 前往 https://github.com/settings/tokens
3. 點擊 "Generate new token (classic)"
4. 選擇權限 (至少需要):
   - ✅ `repo` - 完整倉庫存取
   - ✅ `workflow` - GitHub Actions 存取
   - ✅ `read:org` - 讀取組織資訊
5. 生成並複製 Token

### 1.2 設定環境變數

```bash
# 設定 GitHub Access Token
export GITHUB_ACCESS_TOKEN="your_github_token_here"

# 驗證是否設定成功
echo $GITHUB_ACCESS_TOKEN
```

## 步驟 2: 快速連接測試

執行測試腳本驗證 GitHub API 連接:

```bash
node test-github-connection.js
```

**預期輸出:**
```
═══════════════════════════════════════
  GitHub MCP 連接測試
═══════════════════════════════════════

🔍 測試 GitHub API 連接...

1️⃣ 測試獲取用戶資訊...
✅ 成功! 當前用戶: your-username (Your Name)
   Email: your@email.com
   Public Repos: 25

2️⃣ 測試獲取倉庫列表...
✅ 成功! 找到 5 個最近更新的倉庫:
   - owner/repo1 (⭐ 10)
   - owner/repo2 (⭐ 5)
   ...

✅ 所有測試完成!
```

如果看到錯誤，請檢查:
- Token 是否正確設定
- Token 是否有足夠權限
- 網路連接是否正常

## 步驟 3: 編譯專案

```bash
# 安裝依賴 (如果還沒安裝)
npm install

# 編譯 TypeScript
npm run build
```

**預期輸出:**
應該沒有錯誤，並在 `dist/` 目錄生成編譯後的文件。

驗證編譯結果:
```bash
ls -la dist/
```

應該看到:
- `index.js`
- `github-client.js`
- `config.js`
- `types.js`

## 步驟 4: 測試 MCP 伺服器

### 4.1 啟動開發模式

```bash
npm run dev
```

**預期輸出:**
```
GitHub MCP server 已啟動
```

伺服器會等待來自 Claude 的連接。

### 4.2 配置 Claude Desktop

編輯 Claude 的配置文件 (通常在 `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "github-mcp": {
      "command": "node",
      "args": ["/Users/harry_lu/WorkingProject/Gitlab-MCP/dist/index.js"],
      "env": {
        "GITHUB_ACCESS_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

或使用開發模式:

```json
{
  "mcpServers": {
    "github-mcp": {
      "command": "yarn",
      "args": ["dev"],
      "cwd": "/Users/harry_lu/WorkingProject/Gitlab-MCP",
      "env": {
        "GITHUB_ACCESS_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### 4.3 重啟 Claude Desktop

重啟 Claude Desktop 應用程式，讓配置生效。

## 步驟 5: 在 Claude 中測試功能

### 5.1 基本測試

在 Claude 對話中嘗試以下指令:

```
請列出我的 GitHub 倉庫
```

Claude 應該會使用 `github_get_repositories` 工具並顯示你的倉庫列表。

### 5.2 查看倉庫資訊

```
請查看倉庫 owner/repo-name 的詳細資訊
```

替換 `owner/repo-name` 為你實際的倉庫名稱。

### 5.3 查看提交歷史

```
請查看倉庫 owner/repo-name 最近的 5 個提交
```

### 5.4 查看 Issues

```
請列出倉庫 owner/repo-name 的開放 Issues
```

### 5.5 查看 Pull Requests

```
請列出倉庫 owner/repo-name 的 Pull Requests
```

### 5.6 查看 GitHub Actions

```
請查看倉庫 owner/repo-name 最近的 GitHub Actions 運行狀態
```

### 5.7 創建 Issue (可選)

```
請在倉庫 owner/repo-name 創建一個測試 Issue，標題是 "MCP 測試"，內容是 "這是一個測試 Issue"
```

⚠️ **注意**: 這會在你的倉庫中創建實際的 Issue!

### 5.8 讀取文件

```
請讀取倉庫 owner/repo-name 中的 README.md 文件
```

## 步驟 6: 功能檢查清單

驗證以下功能是否正常工作:

- [ ] ✅ 列出倉庫列表
- [ ] ✅ 查看倉庫詳細資訊
- [ ] ✅ 查看提交歷史
- [ ] ✅ 查看提交詳情
- [ ] ✅ 查看 GitHub Actions 運行
- [ ] ✅ 查看 Workflow 任務
- [ ] ✅ 獲取任務日誌
- [ ] ✅ 列出 Issues
- [ ] ✅ 查看 Issue 詳情
- [ ] ✅ 創建 Issue
- [ ] ✅ 查看 Issue 評論
- [ ] ✅ 列出 Pull Requests
- [ ] ✅ 查看 PR 詳情
- [ ] ✅ 查看 PR 文件變更
- [ ] ✅ 查看 PR 評論
- [ ] ✅ 讀取文件內容

## 常見問題排查

### 問題 1: Token 無效
**錯誤訊息**: `401 Unauthorized` 或 `Bad credentials`

**解決方法**:
1. 確認 Token 是否正確複製 (沒有多餘空格)
2. 確認 Token 沒有過期
3. 重新生成新的 Token

### 問題 2: 權限不足
**錯誤訊息**: `403 Forbidden` 或 `Resource not accessible`

**解決方法**:
1. 檢查 Token 的權限範圍
2. 確保至少有 `repo` 權限
3. 如果要存取私有倉庫，確認權限正確

### 問題 3: 找不到倉庫
**錯誤訊息**: `404 Not Found`

**解決方法**:
1. 確認倉庫名稱格式正確 (owner/repo)
2. 確認你有該倉庫的存取權限
3. 如果是組織倉庫，確認 Token 有組織存取權限

### 問題 4: API 速率限制
**錯誤訊息**: `403 API rate limit exceeded`

**解決方法**:
1. 等待速率限制重置 (通常每小時重置一次)
2. 使用 Token 可獲得更高的速率限制 (5000/小時)
3. 檢查當前速率限制狀態

### 問題 5: MCP 伺服器無法連接
**症狀**: Claude 無法使用工具

**解決方法**:
1. 檢查 Claude 配置文件路徑是否正確
2. 確認專案已編譯 (`npm run build`)
3. 重啟 Claude Desktop
4. 查看 Claude 的錯誤日誌

## 驗證成功標準

如果以下條件都滿足，表示 GitHub MCP 伺服器已成功配置:

✅ `test-github-connection.js` 所有測試通過
✅ 專案編譯無錯誤
✅ MCP 伺服器成功啟動
✅ Claude 可以成功調用至少一個 GitHub 工具
✅ 可以查看你的倉庫資訊

恭喜! 🎉 你的 GitHub MCP 伺服器已經可以正常使用了!

## 下一步

- 探索更多 GitHub API 功能
- 整合到你的開發工作流中
- 嘗試自動化常見的 GitHub 操作
- 添加自定義功能

如有問題，請查看專案的 README.md 或提交 Issue。
