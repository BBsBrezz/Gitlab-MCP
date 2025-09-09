import axios, { AxiosInstance } from 'axios';
import { config } from './config.js';
import { GitLabClient } from './gitlab-client.js';
import { CreateIssueRequest, CreateMergeRequestRequest } from './types.js';

export interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  permalink: string;
  shortId: string;
  shareId: string;
  status: string;
  statusDetails: any;
  isPublic: boolean;
  platform: string;
  project: {
    id: string;
    name: string;
    slug: string;
  };
  type: string;
  metadata: {
    title: string;
    type: string;
    value: string;
    filename: string;
    function: string;
  };
  numComments: number;
  assignedTo: any;
  logger: string;
  level: string;
  isBookmarked: boolean;
  isSubscribed: boolean;
  subscriptionDetails: any;
  hasSeen: boolean;
  lastSeen: string;
  firstSeen: string;
  count: string;
  userCount: number;
  stats: any;
  culpritModule: string;
  tags: Array<{
    key: string;
    value: string;
  }>;
}

export interface SentryEvent {
  id: string;
  message: string;
  platform: string;
  datetime: string;
  tags: Array<{
    key: string;
    value: string;
  }>;
  user: any;
  context: any;
  entries: Array<{
    type: string;
    data: any;
  }>;
  errors: Array<{
    type: string;
    message: string;
  }>;
}

export class SentryIntegration {
  private client: AxiosInstance;
  private gitlabClient: GitLabClient;
  private orgSlug: string;
  private projectSlug: string;

  constructor(gitlabClient: GitLabClient) {
    this.gitlabClient = gitlabClient;
    this.orgSlug = config.sentryOrgSlug || '';
    this.projectSlug = config.sentryProject || '';

    if (!config.sentryAuthToken) {
      throw new Error('Sentry auth token is required for integration');
    }

    const sentryBaseUrl = config.sentryUrl || 'https://sentry.io';
    this.client = axios.create({
      baseURL: `${sentryBaseUrl}/api/0`,
      headers: {
        'Authorization': `Bearer ${config.sentryAuthToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getSentryIssues(options: {
    query?: string;
    statsPeriod?: string;
    shortIdLookup?: boolean;
    limit?: number;
  } = {}): Promise<SentryIssue[]> {
    const params = {
      query: options.query || 'is:unresolved',
      statsPeriod: options.statsPeriod || '24h',
      shortIdLookup: options.shortIdLookup || false,
      limit: options.limit || 25,
    };

    const response = await this.client.get(
      `/projects/${this.orgSlug}/${this.projectSlug}/issues/`,
      { params }
    );

    return response.data;
  }

  async getSentryIssue(issueId: string): Promise<SentryIssue> {
    const response = await this.client.get(
      `/issues/${issueId}/`
    );

    return response.data;
  }

  async getSentryEvents(issueId: string, limit: number = 10): Promise<SentryEvent[]> {
    const response = await this.client.get(
      `/issues/${issueId}/events/`,
      { params: { limit } }
    );

    return response.data;
  }

  async createGitLabIssueFromSentryIssue(
    sentryIssue: SentryIssue,
    gitlabProjectId: string,
    options: {
      assigneeIds?: number[];
      labels?: string[];
      addStackTrace?: boolean;
    } = {}
  ): Promise<any> {
    const events = await this.getSentryEvents(sentryIssue.id, 1);
    const latestEvent = events[0];

    let description = `## Sentry 錯誤報告\n\n`;
    description += `**錯誤類型:** ${sentryIssue.metadata.type}\n`;
    description += `**錯誤訊息:** ${sentryIssue.metadata.value}\n`;
    description += `**發生檔案:** ${sentryIssue.metadata.filename}\n`;
    description += `**發生函數:** ${sentryIssue.metadata.function}\n`;
    description += `**平台:** ${sentryIssue.platform}\n`;
    description += `**日誌等級:** ${sentryIssue.level}\n`;
    description += `**首次發生:** ${new Date(sentryIssue.firstSeen).toLocaleString()}\n`;
    description += `**最後發生:** ${new Date(sentryIssue.lastSeen).toLocaleString()}\n`;
    description += `**發生次數:** ${sentryIssue.count}\n`;
    description += `**受影響用戶:** ${sentryIssue.userCount}\n`;
    description += `**Sentry 連結:** ${sentryIssue.permalink}\n\n`;

    if (sentryIssue.tags && sentryIssue.tags.length > 0) {
      description += `**標籤:**\n`;
      sentryIssue.tags.forEach(tag => {
        description += `- ${tag.key}: ${tag.value}\n`;
      });
      description += `\n`;
    }

    if (options.addStackTrace && latestEvent) {
      const stackTrace = this.extractStackTrace(latestEvent);
      if (stackTrace) {
        description += `## 堆疊追蹤\n\n\`\`\`\n${stackTrace}\`\`\`\n\n`;
      }
    }

    description += `## 建議修復步驟\n\n`;
    description += `1. 檢查錯誤發生的檔案和函數\n`;
    description += `2. 分析堆疊追蹤確定根本原因\n`;
    description += `3. 編寫測試用例重現問題\n`;
    description += `4. 實作修復方案\n`;
    description += `5. 驗證修復效果\n\n`;
    description += `_此問題由 GitLab MCP 從 Sentry 自動創建_`;

    const labels = options.labels || [];
    labels.push('sentry', 'bug', sentryIssue.level);

    const issueData: CreateIssueRequest = {
      title: `[Sentry] ${sentryIssue.title}`,
      description,
      assignee_ids: options.assigneeIds,
      labels,
    };

    return await this.gitlabClient.createIssue(gitlabProjectId, issueData);
  }

  async createFixBranch(
    gitlabProjectId: string,
    sentryIssue: SentryIssue,
    baseBranch: string = 'main'
  ): Promise<string> {
    const branchName = `fix/sentry-${sentryIssue.shortId}-${Date.now()}`;
    
    // 這裡需要使用 GitLab API 創建分支
    // 由於 GitLab API 創建分支需要更多設定，這裡提供分支名稱建議
    return branchName;
  }

  async createMergeRequestForSentryFix(
    gitlabProjectId: string,
    sentryIssue: SentryIssue,
    sourceBranch: string,
    targetBranch: string = 'main',
    options: {
      assigneeIds?: number[];
      reviewerIds?: number[];
      labels?: string[];
    } = {}
  ): Promise<any> {
    let description = `## 修復 Sentry 錯誤\n\n`;
    description += `**相關 Sentry 問題:** ${sentryIssue.permalink}\n`;
    description += `**錯誤類型:** ${sentryIssue.metadata.type}\n`;
    description += `**錯誤訊息:** ${sentryIssue.metadata.value}\n`;
    description += `**發生檔案:** ${sentryIssue.metadata.filename}\n`;
    description += `**發生函數:** ${sentryIssue.metadata.function}\n\n`;

    description += `## 修復內容\n\n`;
    description += `- [ ] 修復根本原因\n`;
    description += `- [ ] 新增測試用例\n`;
    description += `- [ ] 更新相關文檔\n`;
    description += `- [ ] 驗證修復效果\n\n`;

    description += `## 測試計畫\n\n`;
    description += `1. 單元測試確保修復正確\n`;
    description += `2. 整合測試確保不影響其他功能\n`;
    description += `3. 部署到測試環境驗證\n\n`;

    description += `_此 MR 由 GitLab MCP 自動創建以修復 Sentry 問題_`;

    const labels = options.labels || [];
    labels.push('sentry-fix', 'bug-fix');

    const mergeRequestData: CreateMergeRequestRequest = {
      title: `Fix: ${sentryIssue.title}`,
      source_branch: sourceBranch,
      target_branch: targetBranch,
      description,
      assignee_ids: options.assigneeIds,
      reviewer_ids: options.reviewerIds,
      labels,
      remove_source_branch: true,
    };

    return await this.gitlabClient.createMergeRequest(gitlabProjectId, mergeRequestData);
  }

  private extractStackTrace(event: SentryEvent): string | null {
    const stacktraceEntry = event.entries.find(entry => entry.type === 'exception');
    if (!stacktraceEntry) return null;

    try {
      const exception = stacktraceEntry.data.values[0];
      if (exception.stacktrace && exception.stacktrace.frames) {
        return exception.stacktrace.frames
          .map((frame: any) => {
            const filename = frame.filename || 'unknown';
            const function_name = frame.function || 'unknown';
            const lineno = frame.lineno || '?';
            return `  at ${function_name} (${filename}:${lineno})`;
          })
          .join('\n');
      }
    } catch (error) {
      console.error('Error extracting stack trace:', error);
    }

    return null;
  }

  async generateCodeAnalysisFromSentryIssue(sentryIssue: SentryIssue): Promise<string> {
    const events = await this.getSentryEvents(sentryIssue.id, 1);
    const latestEvent = events[0];

    let analysis = `## 程式碼分析報告\n\n`;
    analysis += `**問題檔案:** ${sentryIssue.metadata.filename}\n`;
    analysis += `**問題函數:** ${sentryIssue.metadata.function}\n`;
    analysis += `**錯誤類型:** ${sentryIssue.metadata.type}\n`;
    analysis += `**錯誤訊息:** ${sentryIssue.metadata.value}\n\n`;

    if (latestEvent) {
      const stackTrace = this.extractStackTrace(latestEvent);
      if (stackTrace) {
        analysis += `**堆疊追蹤:**\n\`\`\`\n${stackTrace}\`\`\`\n\n`;
      }
    }

    analysis += `## 可能的修復方案\n\n`;
    
    // 根據錯誤類型提供建議
    switch (sentryIssue.metadata.type) {
      case 'TypeError':
        analysis += `- 檢查變數類型和空值處理\n`;
        analysis += `- 確保物件屬性存在後再存取\n`;
        analysis += `- 新增類型檢查和防護條件\n`;
        break;
      case 'ReferenceError':
        analysis += `- 確保變數已經定義\n`;
        analysis += `- 檢查變數作用域\n`;
        analysis += `- 確認模組匯入正確\n`;
        break;
      case 'SyntaxError':
        analysis += `- 檢查語法錯誤\n`;
        analysis += `- 確認括號和引號配對\n`;
        analysis += `- 驗證程式碼格式\n`;
        break;
      default:
        analysis += `- 根據錯誤訊息分析具體問題\n`;
        analysis += `- 檢查相關程式碼邏輯\n`;
        analysis += `- 新增適當的錯誤處理\n`;
        break;
    }

    return analysis;
  }
}