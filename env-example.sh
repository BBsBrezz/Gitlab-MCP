#!/bin/bash

# GitLab MCP 環境變數範例
# 將以下內容加到你的 ~/.zshrc 文件中

# ====== 必要配置 ======
# GitLab 基本設定
export GITLAB_BASE_URL="https://gitlab.com"                    # 或你的 GitLab 實例 URL
export GITLAB_ACCESS_TOKEN="your_gitlab_access_token"          # 你的 GitLab Personal Access Token

# ====== 可選配置 ======
# Sentry 整合 (如果要使用 Sentry 自動修復功能)
export SENTRY_DSN="your_sentry_dsn"                           # Sentry DSN
export SENTRY_ORG="your_sentry_org"                           # Sentry 組織名稱
export SENTRY_PROJECT="your_sentry_project"                   # Sentry 專案名稱
export SENTRY_AUTH_TOKEN="your_sentry_auth_token"             # Sentry Auth Token

# AI 功能增強 (如果要使用 AI 程式碼分析)
export OPENAI_API_KEY="your_openai_api_key"                   # OpenAI API Key
export ANTHROPIC_API_KEY="your_anthropic_api_key"             # Anthropic API Key

# ====== 使用說明 ======
# 1. 複製需要的環境變數到 ~/.zshrc
# 2. 填入你的實際 token 和設定
# 3. 執行 source ~/.zshrc 重新載入
# 4. 重新啟動 Claude 來使用 GitLab MCP

echo "GitLab MCP 環境變數範例"
echo "請將需要的環境變數複製到 ~/.zshrc 中"