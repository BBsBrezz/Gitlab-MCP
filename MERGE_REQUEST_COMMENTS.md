# GitLab MCP - 合併請求評論功能

## 新增功能

本次更新為 GitLab MCP 伺服器添加了完整的合併請求（Merge Request）和問題（Issue）評論功能。

### 新增的工具

#### 合併請求評論
1. **`gitlab_get_mr_notes`** - 獲取合併請求的評論列表
2. **`gitlab_create_mr_note`** - 在合併請求中發表評論
3. **`gitlab_update_mr_note`** - 更新合併請求的評論
4. **`gitlab_delete_mr_note`** - 刪除合併請求的評論

#### 問題評論
5. **`gitlab_get_issue_notes`** - 獲取問題的評論列表
6. **`gitlab_create_issue_note`** - 在問題中發表評論

### 功能特色

- ✅ 支援機密評論（confidential）
- ✅ 支援內部評論（internal）
- ✅ 自動過濾系統評論，只顯示用戶評論
- ✅ 提供直接連結到評論的 URL
- ✅ 完整的錯誤處理
- ✅ 支援排序和分頁

### 使用範例

#### 獲取合併請求評論
```json
{
  "name": "gitlab_get_mr_notes",
  "arguments": {
    "projectId": "my-group/my-project",
    "mergeRequestIid": 123,
    "sort": "asc",
    "per_page": 50
  }
}
```

#### 發表評論
```json
{
  "name": "gitlab_create_mr_note",
  "arguments": {
    "projectId": "my-group/my-project",
    "mergeRequestIid": 123,
    "body": "這個更改看起來不錯！👍",
    "confidential": false,
    "internal": false
  }
}
```

#### 更新評論
```json
{
  "name": "gitlab_update_mr_note",
  "arguments": {
    "projectId": "my-group/my-project",
    "mergeRequestIid": 123,
    "noteId": 456,
    "body": "更新後的評論內容"
  }
}
```

### 新增的型別定義

在 `types.ts` 中新增了：

```typescript
export interface GitLabNote {
  id: number;
  type: string;
  body: string;
  author: {
    id: number;
    username: string;
    name: string;
    email: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  system: boolean;
  confidential: boolean;
  internal: boolean;
  // ... 更多欄位
}

export interface CreateNoteRequest {
  body: string;
  confidential?: boolean;
  internal?: boolean;
}
```

### GitLabClient 新增方法

- `getMergeRequestNotes()` - 獲取 MR 評論
- `createMergeRequestNote()` - 創建 MR 評論
- `updateMergeRequestNote()` - 更新 MR 評論
- `deleteMergeRequestNote()` - 刪除 MR 評論
- `getIssueNotes()` - 獲取問題評論
- `createIssueNote()` - 創建問題評論
- `getNoteUrl()` - 獲取評論 URL

### 測試

執行以下指令測試新功能：

```bash
# 編譯專案
yarn build

# 執行測試（需要設定 GITLAB_ACCESS_TOKEN 環境變數）
node test-comments.js
```

### 權限要求

使用評論功能需要 GitLab Access Token 具備以下權限：
- `api` - 完整 API 存取權限
- 或 `read_api` + `write_repository` - 讀取 API 和寫入權限

### 注意事項

1. 系統自動生成的評論（如合併、關閉等操作）會被自動過濾掉
2. 評論支援 Markdown 格式
3. 內部評論只有專案成員可見
4. 機密評論只有特定權限的用戶可見
5. 只有評論的作者或專案維護者可以更新/刪除評論