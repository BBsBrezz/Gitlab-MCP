# 🔮 Google Gemini AI Code Review 設置指南

本專案使用 **Google Gemini 1.5 Pro** 作為 AI Code Review Agent，自動分析每個 Pull Request 並提供專業的程式碼審查建議。

---

## 🎁 為什麼選擇 Gemini？

- ✅ **免費額度** - 每分鐘 15 次請求的免費配額
- ✅ **強大功能** - Gemini 1.5 Pro 具有優秀的程式碼理解能力
- ✅ **大上下文** - 支持 2M tokens，可以處理大型 PR
- ✅ **快速響應** - API 響應速度快
- ✅ **多語言支持** - 支持繁體中文審查

---

## 🚀 快速開始

### 步驟 1: 獲取 Gemini API Key

1. **前往 Google AI Studio**
   ```
   https://makersuite.google.com/app/apikey
   ```
   或
   ```
   https://aistudio.google.com/app/apikey
   ```

2. **登入 Google 帳號**
   - 使用你的 Google 帳號登入

3. **創建 API Key**
   - 點擊 **"Create API key"** 按鈕
   - 選擇你的 Google Cloud 專案（或創建新專案）
   - 系統會生成 API key

4. **複製 API Key**
   - 格式類似：`AIzaSy...`
   - 立即複製並保存

### 步驟 2: 添加到 GitHub Secrets

1. **前往 GitHub Repository**
   ```
   https://github.com/BBsBrezz/Gitlab-MCP
   ```

2. **進入 Settings**
   - 點擊 **Settings** 標籤

3. **添加 Secret**
   - 左側導航：**Secrets and variables** → **Actions**
   - 點擊 **"New repository secret"**

4. **填寫資訊**
   ```
   Name: GEMINI_API_KEY
   Secret: AIzaSy... (你的 Gemini API key)
   ```

5. **保存**
   - 點擊 **"Add secret"**

### 步驟 3: 驗證設置

1. 創建或更新任何 Pull Request
2. GitHub Actions 會自動觸發
3. 等待 2-3 分鐘
4. 查看 PR 中的 AI 審查評論

---

## 📊 Gemini API 配額

### 免費配額（Gemini 1.5 Pro）

| 項目 | 限制 |
|------|------|
| **每分鐘請求數** | 15 次 |
| **每天請求數** | 1,500 次 |
| **輸入 tokens** | 每分鐘 1M tokens |
| **輸出 tokens** | 每分鐘 32K tokens |

### 費用估算

對於小型專案：
- **完全免費** ✅
- 免費配額足夠大部分使用場景
- 每個 PR 審查約使用 1 次請求

如果需要更高配額：
- 可以升級到 Pay-as-you-go
- Gemini 1.5 Pro 定價很實惠

---

## 🎯 使用方式

### 自動觸發

一旦設置完成，AI Code Review 會在以下情況**自動執行**：

- ✅ 創建新的 Pull Request
- ✅ 向 PR 推送新的 commits

### 運行流程

```
PR 創建/更新
    ↓
GitHub Actions 觸發
    ↓
使用 MCP GitHubClient 獲取 PR 資料
    ↓
調用 Gemini 1.5 Pro API 分析
    ↓
發布 AI 審查評論到 PR
```

### 查看結果

AI 審查完成後，你會在 PR 中看到：

```
🤖 AI Code Review by Google Gemini

[詳細的程式碼審查內容]

---
審查模型: Google Gemini 1.5 Pro
審查時間: 2025-10-09 ...
自動化工具: GitHub MCP + Gemini API
```

---

## 🧪 本地測試

你也可以在本地手動運行 AI Code Review：

```bash
# 設置環境變數
export GEMINI_API_KEY="AIzaSy..."
export GITHUB_ACCESS_TOKEN="your-github-token"
export GITHUB_REPOSITORY="BBsBrezz/Gitlab-MCP"
export PR_NUMBER="4"

# 安裝依賴
npm install

# 編譯 TypeScript
npm run build

# 執行 AI 審查
node ai-code-reviewer.js
```

---

## ⚙️ 自定義配置

### 調整 AI 模型

編輯 `ai-code-reviewer.js` 中的模型配置：

```javascript
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",  // 可選: gemini-1.5-flash (更快但能力較弱)
});
```

### 可用模型

| 模型 | 特點 | 適用場景 |
|------|------|----------|
| `gemini-1.5-pro` | 最強大 | 複雜程式碼審查 |
| `gemini-1.5-flash` | 最快速 | 簡單 PR 快速審查 |
| `gemini-1.0-pro` | 較舊 | 不推薦 |

### 調整審查重點

編輯 `ai-code-reviewer.js` 中的 `buildPrompt` 函數來自定義審查項目。

---

## 🔒 安全最佳實踐

1. ✅ **永遠不要在程式碼中硬編碼 API keys**
2. ✅ **使用 GitHub Secrets 存儲敏感資訊**
3. ✅ **定期檢查 API 使用量**
4. ✅ **如果 key 洩漏，立即在 Google AI Studio 刪除並重新創建**

---

## 🐛 故障排除

### AI 審查沒有運行

**檢查**:
1. GitHub Secret `GEMINI_API_KEY` 是否正確設置
2. Workflow 文件是否在 `master` 分支
3. Actions 頁面查看錯誤日誌

### API 錯誤

**常見錯誤**:

#### `400 - Invalid API key`
- 原因：API key 無效或格式錯誤
- 解決：重新創建 API key

#### `429 - Resource exhausted`
- 原因：超過免費配額（每分鐘 15 次請求）
- 解決：等待一分鐘後重試，或升級到付費方案

#### `403 - API not enabled`
- 原因：Gemini API 未在 Google Cloud 專案中啟用
- 解決：前往 Google Cloud Console 啟用 Generative Language API

### 評論未發布

**檢查**:
- GitHub Actions 是否有 `pull-requests: write` 權限
- `GITHUB_TOKEN` 是否有效
- PR 是否已關閉

---

## 📚 延伸閱讀

- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API 文檔](https://ai.google.dev/docs)
- [Gemini API 定價](https://ai.google.dev/pricing)
- [GitHub Actions 文檔](https://docs.github.com/en/actions)

---

## 🆚 Gemini vs Claude vs GPT-4

| 特性 | Gemini 1.5 Pro | Claude 3.5 Sonnet | GPT-4 |
|------|----------------|-------------------|--------|
| **免費配額** | ✅ 1500/天 | ❌ 需付費 | ❌ 需付費 |
| **程式碼理解** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **上下文長度** | 2M tokens | 200K tokens | 128K tokens |
| **響應速度** | ⚡⚡⚡ | ⚡⚡ | ⚡⚡ |
| **成本** | 免費/便宜 | 中等 | 較貴 |
| **繁中支持** | ✅ 優秀 | ✅ 優秀 | ✅ 良好 |

**推薦**：
- 🎁 預算有限 → **Gemini** (免費配額)
- 🎯 追求最佳品質 → **Claude** (需付費)
- 🔄 需要平衡 → **GPT-4** (需付費)

---

## 🎉 完成！

現在每個 PR 都會自動獲得 Google Gemini 的專業審查建議！

💡 **提示**: Gemini 的免費配額對大部分小型專案來說完全夠用！

如有問題，請查看：
- [GitHub Issues](https://github.com/BBsBrezz/Gitlab-MCP/issues)
- [Gemini API Support](https://ai.google.dev/support)
