# 🤖 AI Code Review 設置指南

本專案使用 **Claude 3.5 Sonnet** 作為 AI Code Review Agent，自動分析每個 Pull Request 並提供專業的程式碼審查建議。

---

## 📋 功能特性

AI Code Review Agent 會自動分析：

- ✅ **程式碼品質** - 可讀性、維護性、命名規範
- ✅ **潛在問題** - 邏輯錯誤、邊界條件、錯誤處理
- ✅ **安全性** - 安全漏洞、敏感資訊、輸入驗證
- ✅ **性能** - 性能瓶頸、優化建議
- ✅ **測試** - 測試覆蓋率、測試品質
- ✅ **最佳實踐** - 設計模式、現代化寫法
- ✅ **文檔** - 註釋、API 文檔、README

---

## 🔧 設置步驟

### 1. 獲取 Anthropic API Key

1. 前往 [Anthropic Console](https://console.anthropic.com/)
2. 登入或註冊帳號
3. 進入 **API Keys** 頁面
4. 點擊 **Create Key** 創建新的 API key
5. 複製生成的 API key（格式：`sk-ant-api03-...`）

### 2. 設置 GitHub Secret

1. 前往你的 GitHub repository
2. 點擊 **Settings** → **Secrets and variables** → **Actions**
3. 點擊 **New repository secret**
4. 設置：
   - **Name**: `ANTHROPIC_API_KEY`
   - **Secret**: 貼上你的 Anthropic API key
5. 點擊 **Add secret**

### 3. 安裝 Claude SDK 依賴

在 `package.json` 中添加依賴：

\`\`\`json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.0"
  }
}
\`\`\`

然後執行：
\`\`\`bash
npm install
\`\`\`

---

## 🚀 使用方式

### 自動觸發

一旦設置完成，AI Code Review 會在以下情況**自動執行**：

- ✅ 創建新的 Pull Request
- ✅ 向 PR 推送新的 commits

### 運行流程

1. **GitHub Actions 觸發** (`.github/workflows/ai-code-review.yml`)
2. **獲取 PR 資料** - 使用 MCP GitHubClient
   - PR 基本資訊
   - 文件變更和 diff
   - 現有評論
3. **Claude AI 分析** - 調用 Claude 3.5 Sonnet API
   - 深度程式碼分析
   - 生成專業建議
4. **發布評論** - 自動在 PR 中發布 AI 審查結果

### 查看結果

AI 審查完成後，你會在 PR 中看到一則評論：

```
🤖 AI Code Review by Claude

[詳細的程式碼審查內容]

---
審查模型: Claude 3.5 Sonnet
審查時間: 2025-10-09 ...
自動化工具: GitHub MCP + Claude API
```

---

## 🧪 本地測試

你也可以在本地手動運行 AI Code Review：

\`\`\`bash
# 設置環境變數
export ANTHROPIC_API_KEY="your-api-key"
export GITHUB_ACCESS_TOKEN="your-github-token"
export GITHUB_REPOSITORY="owner/repo"
export PR_NUMBER="1"

# 執行 AI 審查
node ai-code-reviewer.js
\`\`\`

---

## 📊 工作原理

### 架構圖

\`\`\`
PR 創建/更新
    ↓
GitHub Actions 觸發
    ↓
ai-code-reviewer.js 執行
    ↓
┌─────────────────────┐
│ 1. 使用 MCP         │
│    GitHubClient     │
│    獲取 PR 資料     │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ 2. 構建詳細的       │
│    分析 Prompt      │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ 3. 調用 Claude API  │
│    進行深度分析     │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ 4. 發布 AI 評論     │
│    到 PR            │
└─────────────────────┘
\`\`\`

### 核心組件

1. **ai-code-reviewer.js**
   - 主要的 AI 審查腳本
   - 使用 `GitHubClient` 獲取 PR 數據
   - 調用 Claude API 進行分析
   - 發布審查評論

2. **.github/workflows/ai-code-review.yml**
   - GitHub Actions workflow 配置
   - 定義觸發條件和執行步驟

3. **GitHubClient (MCP)**
   - 封裝 GitHub API 調用
   - 提供 PR 資料獲取方法

---

## ⚙️ 自定義配置

### 調整 AI 審查重點

編輯 `ai-code-reviewer.js` 中的 `buildPrompt` 函數，修改審查維度：

\`\`\`javascript
## 請你提供以下方面的審查：

1. **你的自定義審查項目** 🎯
   - 具體要求...
\`\`\`

### 調整 AI 模型參數

在 `analyzeWithClaude` 函數中調整：

\`\`\`javascript
const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,        // 調整回應長度
  temperature: 0.3,        // 調整創造性 (0-1)
  // ...
});
\`\`\`

### 修改觸發條件

編輯 `.github/workflows/ai-code-review.yml`：

\`\`\`yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]  # 添加更多觸發類型
    paths:                                   # 只針對特定文件
      - 'src/**'
      - '!*.md'
\`\`\`

---

## 💰 費用說明

### Anthropic API 定價

Claude 3.5 Sonnet (20241022) 定價：
- **Input**: $3.00 / 1M tokens
- **Output**: $15.00 / 1M tokens

### 估算

一般的 PR 審查：
- Input tokens: ~5,000-10,000 (PR 資料 + prompt)
- Output tokens: ~2,000-4,000 (AI 審查內容)
- **每次審查成本**: ~$0.05-0.15 USD

建議設置每月預算上限。

---

## 🔒 安全最佳實踐

1. ✅ **永遠不要在程式碼中硬編碼 API keys**
2. ✅ **使用 GitHub Secrets 存儲敏感資訊**
3. ✅ **定期輪換 API keys**
4. ✅ **監控 API 使用量和費用**
5. ✅ **限制 workflow 權限**（只給必要的權限）

---

## 🐛 故障排除

### AI 審查沒有運行

**檢查**:
1. GitHub Secret `ANTHROPIC_API_KEY` 是否正確設置
2. Workflow 文件是否在 `master` 分支
3. Actions 頁面查看錯誤日誌

### API 錯誤

**常見錯誤**:
- `401 Unauthorized`: API key 無效或過期
- `429 Too Many Requests`: 超過速率限制
- `500 Internal Server Error`: Anthropic 服務問題

**解決方法**:
- 檢查 API key 是否正確
- 減少請求頻率
- 查看 Anthropic 狀態頁面

### 評論未發布

**檢查**:
- GitHub Actions 是否有 `pull-requests: write` 權限
- `GITHUB_TOKEN` 是否有效
- PR 是否已關閉

---

## 📚 延伸閱讀

- [Anthropic API 文檔](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Claude 3.5 Sonnet 模型說明](https://www.anthropic.com/claude)
- [GitHub Actions 文檔](https://docs.github.com/en/actions)
- [GitHub MCP 文檔](./README.md)

---

## 🎉 完成！

現在每個 PR 都會自動獲得 AI 的專業審查建議，幫助你：
- ✅ 提升程式碼品質
- ✅ 發現潛在問題
- ✅ 學習最佳實踐
- ✅ 加快審查流程

💡 **提示**: AI 審查是輔助工具，仍建議結合人工審查以確保最佳結果！
