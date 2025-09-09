#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { GitLabClient } from './gitlab-client.js';
import { SentryIntegration } from './sentry-integration.js';
import { config } from './config.js';

const server = new Server(
  {
    name: 'gitlab-mcp',
    version: '1.0.0',
  }
);

const gitlabClient = new GitLabClient();
let sentryIntegration: SentryIntegration | null = null;

// 如果有 Sentry 配置，初始化 Sentry 整合
if (config.sentryAuthToken && config.sentryOrgSlug && config.sentryProject) {
  try {
    sentryIntegration = new SentryIntegration(gitlabClient);
  } catch (error) {
    console.error('Failed to initialize Sentry integration:', error);
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'gitlab_get_projects',
        description: '獲取 GitLab 專案列表',
        inputSchema: {
          type: 'object',
          properties: {
            owned: {
              type: 'boolean',
              description: '是否只顯示擁有的專案',
            },
            starred: {
              type: 'boolean',
              description: '是否只顯示星標專案',
            },
            search: {
              type: 'string',
              description: '搜尋關鍵字',
            },
            per_page: {
              type: 'number',
              description: '每頁顯示數量 (預設 20)',
              default: 20,
            },
          },
        },
      },
      {
        name: 'gitlab_get_project',
        description: '獲取特定專案的詳細資訊',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑 (例如: "group/project")',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'gitlab_get_commits',
        description: '獲取專案的提交歷史',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            ref_name: {
              type: 'string',
              description: '分支或標籤名稱',
            },
            since: {
              type: 'string',
              description: '起始時間 (ISO 8601 格式)',
            },
            until: {
              type: 'string',
              description: '結束時間 (ISO 8601 格式)',
            },
            path: {
              type: 'string',
              description: '檔案路徑',
            },
            per_page: {
              type: 'number',
              description: '每頁顯示數量',
              default: 20,
            },
            with_stats: {
              type: 'boolean',
              description: '是否包含統計資料',
              default: false,
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'gitlab_get_commit',
        description: '獲取特定提交的詳細資訊',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            sha: {
              type: 'string',
              description: '提交的 SHA 值',
            },
          },
          required: ['projectId', 'sha'],
        },
      },
      {
        name: 'gitlab_get_commit_diff',
        description: '獲取提交的差異內容',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            sha: {
              type: 'string',
              description: '提交的 SHA 值',
            },
          },
          required: ['projectId', 'sha'],
        },
      },
      {
        name: 'gitlab_get_pipelines',
        description: '獲取專案的 CI/CD 流水線',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            status: {
              type: 'string',
              description: '流水線狀態',
              enum: ['running', 'pending', 'success', 'failed', 'canceled', 'skipped', 'manual'],
            },
            ref: {
              type: 'string',
              description: '分支或標籤名稱',
            },
            per_page: {
              type: 'number',
              description: '每頁顯示數量',
              default: 20,
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'gitlab_get_pipeline',
        description: '獲取特定流水線的詳細資訊',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            pipelineId: {
              type: 'number',
              description: '流水線 ID',
            },
          },
          required: ['projectId', 'pipelineId'],
        },
      },
      {
        name: 'gitlab_get_pipeline_jobs',
        description: '獲取流水線的工作任務',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            pipelineId: {
              type: 'number',
              description: '流水線 ID',
            },
          },
          required: ['projectId', 'pipelineId'],
        },
      },
      {
        name: 'gitlab_get_job_log',
        description: '獲取工作任務的日誌',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            jobId: {
              type: 'number',
              description: '工作任務 ID',
            },
          },
          required: ['projectId', 'jobId'],
        },
      },
      {
        name: 'gitlab_get_issues',
        description: '獲取專案的問題列表',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            state: {
              type: 'string',
              description: '問題狀態',
              enum: ['opened', 'closed', 'all'],
              default: 'opened',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: '標籤列表',
            },
            search: {
              type: 'string',
              description: '搜尋關鍵字',
            },
            per_page: {
              type: 'number',
              description: '每頁顯示數量',
              default: 20,
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'gitlab_get_issue',
        description: '獲取特定問題的詳細資訊',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            issueIid: {
              type: 'number',
              description: '問題的 IID',
            },
          },
          required: ['projectId', 'issueIid'],
        },
      },
      {
        name: 'gitlab_create_issue',
        description: '創建新問題',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            title: {
              type: 'string',
              description: '問題標題',
            },
            description: {
              type: 'string',
              description: '問題描述',
            },
            assignee_ids: {
              type: 'array',
              items: { type: 'number' },
              description: '指派給用戶的 ID 列表',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: '標籤列表',
            },
          },
          required: ['projectId', 'title'],
        },
      },
      {
        name: 'gitlab_get_merge_requests',
        description: '獲取合併請求列表',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            state: {
              type: 'string',
              description: '合併請求狀態',
              enum: ['opened', 'closed', 'merged', 'all'],
              default: 'opened',
            },
            source_branch: {
              type: 'string',
              description: '源分支',
            },
            target_branch: {
              type: 'string',
              description: '目標分支',
            },
            search: {
              type: 'string',
              description: '搜尋關鍵字',
            },
            per_page: {
              type: 'number',
              description: '每頁顯示數量',
              default: 20,
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'gitlab_get_merge_request',
        description: '獲取特定合併請求的詳細資訊',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            mergeRequestIid: {
              type: 'number',
              description: '合併請求的 IID',
            },
          },
          required: ['projectId', 'mergeRequestIid'],
        },
      },
      {
        name: 'gitlab_create_merge_request',
        description: '創建新的合併請求',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            title: {
              type: 'string',
              description: '合併請求標題',
            },
            source_branch: {
              type: 'string',
              description: '源分支',
            },
            target_branch: {
              type: 'string',
              description: '目標分支',
            },
            description: {
              type: 'string',
              description: '合併請求描述',
            },
            assignee_ids: {
              type: 'array',
              items: { type: 'number' },
              description: '指派給用戶的 ID 列表',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: '標籤列表',
            },
            remove_source_branch: {
              type: 'boolean',
              description: '合併後是否刪除源分支',
              default: false,
            },
          },
          required: ['projectId', 'title', 'source_branch', 'target_branch'],
        },
      },
      {
        name: 'gitlab_get_mr_changes',
        description: '獲取合併請求的變更內容',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            mergeRequestIid: {
              type: 'number',
              description: '合併請求的 IID',
            },
          },
          required: ['projectId', 'mergeRequestIid'],
        },
      },
      {
        name: 'gitlab_analyze_commit_changes',
        description: '分析提交的程式碼變更',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            sha: {
              type: 'string',
              description: '提交的 SHA 值',
            },
            includeAiAnalysis: {
              type: 'boolean',
              description: '是否包含 AI 分析',
              default: false,
            },
          },
          required: ['projectId', 'sha'],
        },
      },
      // Sentry 整合工具
      {
        name: 'sentry_get_issues',
        description: '獲取 Sentry 問題列表',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '搜尋查詢 (預設: is:unresolved)',
              default: 'is:unresolved',
            },
            statsPeriod: {
              type: 'string',
              description: '統計期間 (例如: 24h, 7d, 30d)',
              default: '24h',
            },
            limit: {
              type: 'number',
              description: '返回結果數量限制',
              default: 25,
            },
          },
        },
      },
      {
        name: 'sentry_get_issue',
        description: '獲取特定 Sentry 問題的詳細資訊',
        inputSchema: {
          type: 'object',
          properties: {
            issueId: {
              type: 'string',
              description: 'Sentry 問題 ID',
            },
          },
          required: ['issueId'],
        },
      },
      {
        name: 'sentry_create_gitlab_issue',
        description: '從 Sentry 問題創建 GitLab 問題',
        inputSchema: {
          type: 'object',
          properties: {
            sentryIssueId: {
              type: 'string',
              description: 'Sentry 問題 ID',
            },
            gitlabProjectId: {
              type: 'string',
              description: 'GitLab 專案 ID 或路徑',
            },
            assigneeIds: {
              type: 'array',
              items: { type: 'number' },
              description: '指派給用戶的 ID 列表 (可選)',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: '額外標籤 (可選)',
            },
            addStackTrace: {
              type: 'boolean',
              description: '是否包含堆疊追蹤',
              default: true,
            },
          },
          required: ['sentryIssueId', 'gitlabProjectId'],
        },
      },
      {
        name: 'sentry_create_fix_mr',
        description: '從 Sentry 問題創建修復用的 GitLab 合併請求',
        inputSchema: {
          type: 'object',
          properties: {
            sentryIssueId: {
              type: 'string',
              description: 'Sentry 問題 ID',
            },
            gitlabProjectId: {
              type: 'string',
              description: 'GitLab 專案 ID 或路徑',
            },
            sourceBranch: {
              type: 'string',
              description: '源分支名稱',
            },
            targetBranch: {
              type: 'string',
              description: '目標分支名稱',
              default: 'main',
            },
            assigneeIds: {
              type: 'array',
              items: { type: 'number' },
              description: '指派給用戶的 ID 列表 (可選)',
            },
            reviewerIds: {
              type: 'array',
              items: { type: 'number' },
              description: '審核者 ID 列表 (可選)',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: '額外標籤 (可選)',
            },
          },
          required: ['sentryIssueId', 'gitlabProjectId', 'sourceBranch'],
        },
      },
      {
        name: 'sentry_analyze_issue',
        description: '分析 Sentry 問題並生成修復建議',
        inputSchema: {
          type: 'object',
          properties: {
            sentryIssueId: {
              type: 'string',
              description: 'Sentry 問題 ID',
            },
          },
          required: ['sentryIssueId'],
        },
      },
      // 檔案和程式碼查看工具
      {
        name: 'gitlab_get_file',
        description: '讀取專案中的特定檔案內容',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            filePath: {
              type: 'string',
              description: '檔案路徑 (例如: src/index.js)',
            },
            ref: {
              type: 'string',
              description: '分支或提交 SHA (預設: main)',
              default: 'main',
            },
            raw: {
              type: 'boolean',
              description: '是否返回原始內容 (預設: false)',
              default: false,
            },
          },
          required: ['projectId', 'filePath'],
        },
      },
      {
        name: 'gitlab_get_tree',
        description: '瀏覽專案的目錄結構',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            path: {
              type: 'string',
              description: '目錄路徑 (預設: 根目錄)',
              default: '',
            },
            ref: {
              type: 'string',
              description: '分支或提交 SHA (預設: main)',
              default: 'main',
            },
            recursive: {
              type: 'boolean',
              description: '是否遞迴顯示所有子目錄',
              default: false,
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'gitlab_search_files',
        description: '在專案中搜尋檔案',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            query: {
              type: 'string',
              description: '搜尋關鍵字 (檔名或路徑)',
            },
            ref: {
              type: 'string',
              description: '分支或提交 SHA (預設: main)',
              default: 'main',
            },
            per_page: {
              type: 'number',
              description: '返回結果數量限制 (預設: 50)',
              default: 50,
            },
          },
          required: ['projectId', 'query'],
        },
      },
      {
        name: 'gitlab_get_file_blame',
        description: '查看檔案的程式碼責任歸屬 (每行由誰修改)',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            filePath: {
              type: 'string',
              description: '檔案路徑',
            },
            ref: {
              type: 'string',
              description: '分支或提交 SHA (預設: main)',
              default: 'main',
            },
          },
          required: ['projectId', 'filePath'],
        },
      },
      {
        name: 'gitlab_get_file_history',
        description: '查看檔案的修改歷史',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: '專案 ID 或專案路徑',
            },
            filePath: {
              type: 'string',
              description: '檔案路徑',
            },
            ref: {
              type: 'string',
              description: '分支或提交 SHA (預設: main)',
              default: 'main',
            },
            per_page: {
              type: 'number',
              description: '返回結果數量限制 (預設: 20)',
              default: 20,
            },
          },
          required: ['projectId', 'filePath'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'gitlab_get_projects': {
        const { owned, starred, search, per_page } = args as {
          owned?: boolean;
          starred?: boolean;
          search?: string;
          per_page?: number;
        };

        const projects = await gitlabClient.getProjects({
          owned,
          starred,
          search,
          per_page,
        });

        const projectList = projects.map(project => 
          `• ${project.name} (${project.path_with_namespace})\n  ID: ${project.id}\n  描述: ${project.description || '無描述'}\n  URL: ${project.web_url}\n  預設分支: ${project.default_branch}\n  最後活動: ${new Date(project.last_activity_at).toLocaleDateString()}`
        ).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `找到 ${projects.length} 個專案：\n\n${projectList}`,
            },
          ],
        };
      }

      case 'gitlab_get_project': {
        const { projectId } = args as { projectId: string };

        const project = await gitlabClient.getProject(projectId);

        return {
          content: [
            {
              type: 'text',
              text: `專案資訊：\n專案名稱: ${project.name}\n專案路徑: ${project.path_with_namespace}\nID: ${project.id}\n描述: ${project.description || '無描述'}\n預設分支: ${project.default_branch}\n可見性: ${project.visibility}\n建立時間: ${new Date(project.created_at).toLocaleString()}\n最後活動: ${new Date(project.last_activity_at).toLocaleString()}\n星標數: ${project.star_count}\n分支數: ${project.forks_count}\nURL: ${project.web_url}`,
            },
          ],
        };
      }

      case 'gitlab_get_commits': {
        const { projectId, ref_name, since, until, path, per_page, with_stats } = args as {
          projectId: string;
          ref_name?: string;
          since?: string;
          until?: string;
          path?: string;
          per_page?: number;
          with_stats?: boolean;
        };

        const commits = await gitlabClient.getCommits(projectId, {
          ref_name,
          since,
          until,
          path,
          per_page,
          with_stats,
        });

        const project = await gitlabClient.getProject(projectId);

        const commitList = commits.map(commit => {
          const commitUrl = gitlabClient.getCommitUrl(project, commit);
          const statsInfo = commit.stats ? ` (+${commit.stats.additions} -${commit.stats.deletions})` : '';
          return `• ${commit.short_id} - ${commit.title}\n  作者: ${commit.author_name} (${commit.author_email})\n  時間: ${new Date(commit.committed_date).toLocaleString()}${statsInfo}\n  URL: ${commitUrl}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `找到 ${commits.length} 個提交：\n\n${commitList}`,
            },
          ],
        };
      }

      case 'gitlab_get_commit': {
        const { projectId, sha } = args as { projectId: string; sha: string };

        const commit = await gitlabClient.getCommit(projectId, sha);
        const project = await gitlabClient.getProject(projectId);
        const commitUrl = gitlabClient.getCommitUrl(project, commit);

        return {
          content: [
            {
              type: 'text',
              text: `提交詳細資訊：\n提交 ID: ${commit.id}\n短 ID: ${commit.short_id}\n標題: ${commit.title}\n作者: ${commit.author_name} (${commit.author_email})\n提交者: ${commit.committer_name} (${commit.committer_email})\n作者時間: ${new Date(commit.authored_date).toLocaleString()}\n提交時間: ${new Date(commit.committed_date).toLocaleString()}\n統計: +${commit.stats?.additions || 0} -${commit.stats?.deletions || 0} (總計 ${commit.stats?.total || 0})\nURL: ${commitUrl}\n\n提交訊息:\n${commit.message}`,
            },
          ],
        };
      }

      case 'gitlab_get_commit_diff': {
        const { projectId, sha } = args as { projectId: string; sha: string };

        // 同時獲取 commit 資料和 diff 資料
        const [commit, diffs] = await Promise.all([
          gitlabClient.getCommit(projectId, sha),
          gitlabClient.getCommitDiff(projectId, sha)
        ]);
        const project = await gitlabClient.getProject(projectId);

        // 計算每個檔案的行數變更 (從 diff 內容解析)
        const diffSummary = diffs.map(diff => {
          const changeType = diff.new_file ? '新增' : diff.deleted_file ? '刪除' : '修改';
          const filePath = diff.new_path || diff.old_path;
          
          // 從 diff 內容計算行數
          let additions = 0;
          let deletions = 0;
          
          if (diff.diff) {
            const lines = diff.diff.split('\n');
            for (const line of lines) {
              if (line.startsWith('+') && !line.startsWith('+++')) {
                additions++;
              } else if (line.startsWith('-') && !line.startsWith('---')) {
                deletions++;
              }
            }
          }
          
          return `• ${changeType}: ${filePath}\n  變更行數: +${additions} -${deletions}`;
        }).join('\n\n');

        // 加上總體統計
        const totalStats = commit.stats ? 
          `\n\n總體統計: +${commit.stats.additions || 0} -${commit.stats.deletions || 0} (總計 ${commit.stats.total || 0} 行)` : '';

        return {
          content: [
            {
              type: 'text',
              text: `提交差異摘要 (${diffs.length} 個檔案):\n\n${diffSummary}${totalStats}`,
            },
          ],
        };
      }

      case 'gitlab_get_pipelines': {
        const { projectId, status, ref, per_page } = args as {
          projectId: string;
          status?: string;
          ref?: string;
          per_page?: number;
        };

        const pipelines = await gitlabClient.getPipelines(projectId, {
          status,
          ref,
          per_page,
        });

        const project = await gitlabClient.getProject(projectId);

        const pipelineList = pipelines.map(pipeline => {
          const pipelineUrl = gitlabClient.getPipelineUrl(project, pipeline);
          const duration = pipeline.duration ? ` (${Math.round(pipeline.duration / 60)}分鐘)` : '';
          const userName = pipeline.user?.name || 'Unknown';
          return `• Pipeline #${pipeline.id} - ${pipeline.status}\n  分支: ${pipeline.ref}\n  用戶: ${userName}\n  建立時間: ${new Date(pipeline.created_at).toLocaleString()}${duration}\n  URL: ${pipelineUrl}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `找到 ${pipelines.length} 個流水線：\n\n${pipelineList}`,
            },
          ],
        };
      }

      case 'gitlab_get_pipeline': {
        const { projectId, pipelineId } = args as { projectId: string; pipelineId: number };

        const pipeline = await gitlabClient.getPipeline(projectId, pipelineId);
        const project = await gitlabClient.getProject(projectId);
        const pipelineUrl = gitlabClient.getPipelineUrl(project, pipeline);

        const duration = pipeline.duration ? `${Math.round(pipeline.duration / 60)}分鐘` : '未完成';

        return {
          content: [
            {
              type: 'text',
              text: `流水線詳細資訊：\nPipeline ID: ${pipeline.id}\n狀態: ${pipeline.status}\n分支: ${pipeline.ref}\n提交: ${pipeline.sha}\n用戶: ${pipeline.user?.name || 'Unknown'}\n建立時間: ${new Date(pipeline.created_at).toLocaleString()}\n開始時間: ${pipeline.started_at ? new Date(pipeline.started_at).toLocaleString() : '尚未開始'}\n完成時間: ${pipeline.finished_at ? new Date(pipeline.finished_at).toLocaleString() : '尚未完成'}\n持續時間: ${duration}\nURL: ${pipelineUrl}`,
            },
          ],
        };
      }

      case 'gitlab_get_pipeline_jobs': {
        const { projectId, pipelineId } = args as { projectId: string; pipelineId: number };

        const jobs = await gitlabClient.getPipelineJobs(projectId, pipelineId);

        const jobList = jobs.map(job => {
          const duration = job.duration ? ` (${Math.round(job.duration / 60)}分鐘)` : '';
          return `• ${job.name} - ${job.status}\n  階段: ${job.stage}\n  建立時間: ${new Date(job.created_at).toLocaleString()}${duration}\n  URL: ${job.web_url}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `找到 ${jobs.length} 個工作任務：\n\n${jobList}`,
            },
          ],
        };
      }

      case 'gitlab_get_job_log': {
        const { projectId, jobId } = args as { projectId: string; jobId: number };

        const log = await gitlabClient.getJobLog(projectId, jobId);
        const job = await gitlabClient.getJob(projectId, jobId);

        const logPreview = log.length > 2000 ? `${log.substring(0, 2000)}...\n\n[日誌已截斷，完整日誌請查看: ${job.web_url}]` : log;

        return {
          content: [
            {
              type: 'text',
              text: `工作任務 ${job.name} 的日誌：\n\n${logPreview}`,
            },
          ],
        };
      }

      case 'gitlab_get_issues': {
        const { projectId, state, labels, search, per_page } = args as {
          projectId: string;
          state?: string;
          labels?: string[];
          search?: string;
          per_page?: number;
        };

        const issues = await gitlabClient.getIssues(projectId, {
          state,
          labels,
          search,
          per_page,
        });

        const project = await gitlabClient.getProject(projectId);

        const issueList = issues.map(issue => {
          const issueUrl = gitlabClient.getIssueUrl(project, issue);
          const labelsText = issue.labels.length > 0 ? `\n  標籤: ${issue.labels.join(', ')}` : '';
          return `• #${issue.iid} - ${issue.title}\n  狀態: ${issue.state}\n  作者: ${issue.author.name}\n  建立時間: ${new Date(issue.created_at).toLocaleString()}${labelsText}\n  URL: ${issueUrl}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `找到 ${issues.length} 個問題：\n\n${issueList}`,
            },
          ],
        };
      }

      case 'gitlab_get_issue': {
        const { projectId, issueIid } = args as { projectId: string; issueIid: number };

        const issue = await gitlabClient.getIssue(projectId, issueIid);
        const project = await gitlabClient.getProject(projectId);
        const issueUrl = gitlabClient.getIssueUrl(project, issue);

        const labelsText = issue.labels.length > 0 ? `\n標籤: ${issue.labels.join(', ')}` : '';
        const assigneesText = issue.assignees.length > 0 ? `\n指派給: ${issue.assignees.map(a => a.name).join(', ')}` : '';

        return {
          content: [
            {
              type: 'text',
              text: `問題詳細資訊：\n問題 #${issue.iid}: ${issue.title}\n狀態: ${issue.state}\n作者: ${issue.author.name}\n建立時間: ${new Date(issue.created_at).toLocaleString()}\n更新時間: ${new Date(issue.updated_at).toLocaleString()}${labelsText}${assigneesText}\n評論數: ${issue.user_notes_count}\nURL: ${issueUrl}\n\n描述:\n${issue.description || '無描述'}`,
            },
          ],
        };
      }

      case 'gitlab_create_issue': {
        const { projectId, title, description, assignee_ids, labels } = args as {
          projectId: string;
          title: string;
          description?: string;
          assignee_ids?: number[];
          labels?: string[];
        };

        const issue = await gitlabClient.createIssue(projectId, {
          title,
          description,
          assignee_ids,
          labels,
        });

        const project = await gitlabClient.getProject(projectId);
        const issueUrl = gitlabClient.getIssueUrl(project, issue);

        return {
          content: [
            {
              type: 'text',
              text: `問題建立成功！\n問題 #${issue.iid}: ${issue.title}\n作者: ${issue.author.name}\n建立時間: ${new Date(issue.created_at).toLocaleString()}\nURL: ${issueUrl}`,
            },
          ],
        };
      }

      case 'gitlab_get_merge_requests': {
        const { projectId, state, source_branch, target_branch, search, per_page } = args as {
          projectId: string;
          state?: string;
          source_branch?: string;
          target_branch?: string;
          search?: string;
          per_page?: number;
        };

        const mergeRequests = await gitlabClient.getMergeRequests(projectId, {
          state,
          source_branch,
          target_branch,
          search,
          per_page,
        });

        const project = await gitlabClient.getProject(projectId);

        const mrList = mergeRequests.map(mr => {
          const mrUrl = gitlabClient.getMergeRequestUrl(project, mr);
          const labelsText = mr.labels.length > 0 ? `\n  標籤: ${mr.labels.join(', ')}` : '';
          return `• !${mr.iid} - ${mr.title}\n  狀態: ${mr.state}\n  分支: ${mr.source_branch} → ${mr.target_branch}\n  作者: ${mr.author.name}\n  建立時間: ${new Date(mr.created_at).toLocaleString()}${labelsText}\n  URL: ${mrUrl}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `找到 ${mergeRequests.length} 個合併請求：\n\n${mrList}`,
            },
          ],
        };
      }

      case 'gitlab_get_merge_request': {
        const { projectId, mergeRequestIid } = args as { projectId: string; mergeRequestIid: number };

        const mr = await gitlabClient.getMergeRequest(projectId, mergeRequestIid);
        const project = await gitlabClient.getProject(projectId);
        const mrUrl = gitlabClient.getMergeRequestUrl(project, mr);

        const labelsText = mr.labels.length > 0 ? `\n標籤: ${mr.labels.join(', ')}` : '';
        const assigneesText = mr.assignees.length > 0 ? `\n指派給: ${mr.assignees.map(a => a.name).join(', ')}` : '';

        return {
          content: [
            {
              type: 'text',
              text: `合併請求詳細資訊：\n合併請求 !${mr.iid}: ${mr.title}\n狀態: ${mr.state}\n分支: ${mr.source_branch} → ${mr.target_branch}\n作者: ${mr.author.name}\n建立時間: ${new Date(mr.created_at).toLocaleString()}\n更新時間: ${new Date(mr.updated_at).toLocaleString()}${labelsText}${assigneesText}\n評論數: ${mr.user_notes_count}\n合併狀態: ${mr.merge_status}\nURL: ${mrUrl}\n\n描述:\n${mr.description || '無描述'}`,
            },
          ],
        };
      }

      case 'gitlab_create_merge_request': {
        const { projectId, title, source_branch, target_branch, description, assignee_ids, labels, remove_source_branch } = args as {
          projectId: string;
          title: string;
          source_branch: string;
          target_branch: string;
          description?: string;
          assignee_ids?: number[];
          labels?: string[];
          remove_source_branch?: boolean;
        };

        const mr = await gitlabClient.createMergeRequest(projectId, {
          title,
          source_branch,
          target_branch,
          description,
          assignee_ids,
          labels,
          remove_source_branch,
        });

        const project = await gitlabClient.getProject(projectId);
        const mrUrl = gitlabClient.getMergeRequestUrl(project, mr);

        return {
          content: [
            {
              type: 'text',
              text: `合併請求建立成功！\n合併請求 !${mr.iid}: ${mr.title}\n分支: ${mr.source_branch} → ${mr.target_branch}\n作者: ${mr.author.name}\n建立時間: ${new Date(mr.created_at).toLocaleString()}\nURL: ${mrUrl}`,
            },
          ],
        };
      }

      case 'gitlab_get_mr_changes': {
        const { projectId, mergeRequestIid } = args as { projectId: string; mergeRequestIid: number };

        const changes = await gitlabClient.getMergeRequestChanges(projectId, mergeRequestIid);

        const changesSummary = changes.changes.map((change: any) => {
          const changeType = change.new_file ? '新增' : change.deleted_file ? '刪除' : '修改';
          return `• ${changeType}: ${change.new_path || change.old_path}`;
        }).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `合併請求變更摘要 (${changes.changes.length} 個檔案):\n\n${changesSummary}`,
            },
          ],
        };
      }

      case 'gitlab_analyze_commit_changes': {
        const { projectId, sha, includeAiAnalysis } = args as {
          projectId: string;
          sha: string;
          includeAiAnalysis?: boolean;
        };

        const [commit, diffs] = await Promise.all([
          gitlabClient.getCommit(projectId, sha),
          gitlabClient.getCommitDiff(projectId, sha),
        ]);

        const project = await gitlabClient.getProject(projectId);
        const commitUrl = gitlabClient.getCommitUrl(project, commit);

        const changesSummary = diffs.map(diff => {
          const changeType = diff.new_file ? '新增' : diff.deleted_file ? '刪除' : '修改';
          const fileExtension = (diff.new_path || diff.old_path).split('.').pop();
          
          // 從 diff 內容計算行數
          let added = 0;
          let removed = 0;
          
          if (diff.diff) {
            const lines = diff.diff.split('\n');
            for (const line of lines) {
              if (line.startsWith('+') && !line.startsWith('+++')) {
                added++;
              } else if (line.startsWith('-') && !line.startsWith('---')) {
                removed++;
              }
            }
          }
          
          return {
            type: changeType,
            path: diff.new_path || diff.old_path,
            extension: fileExtension,
            added,
            removed,
          };
        });

        // 使用 commit stats 作為總體統計 (更準確)
        const totalAdded = commit.stats?.additions || changesSummary.reduce((sum, change) => sum + change.added, 0);
        const totalRemoved = commit.stats?.deletions || changesSummary.reduce((sum, change) => sum + change.removed, 0);
        const fileTypes = [...new Set(changesSummary.map(change => change.extension))];

        let analysisText = `程式碼變更分析：\n\n基本統計：\n• 修改檔案數: ${changesSummary.length}\n• 新增行數: ${totalAdded}\n• 刪除行數: ${totalRemoved}\n• 檔案類型: ${fileTypes.join(', ')}\n\n變更詳情：\n${changesSummary.map(change => `• ${change.type}: ${change.path} (+${change.added} -${change.removed})`).join('\n')}\n\n提交資訊：\n• 提交者: ${commit.author_name}\n• 提交時間: ${new Date(commit.committed_date).toLocaleString()}\n• 提交訊息: ${commit.title}\n• URL: ${commitUrl}`;

        if (includeAiAnalysis) {
          analysisText += `\n\n[AI 分析功能需要配置 AI API 金鑰]`;
        }

        return {
          content: [
            {
              type: 'text',
              text: analysisText,
            },
          ],
        };
      }

      // Sentry 整合案例
      case 'sentry_get_issues': {
        if (!sentryIntegration) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'Sentry integration is not configured. Please set SENTRY_AUTH_TOKEN, SENTRY_ORG_SLUG, and SENTRY_PROJECT environment variables.'
          );
        }

        const { query, statsPeriod, limit } = args as {
          query?: string;
          statsPeriod?: string;
          limit?: number;
        };

        const issues = await sentryIntegration.getSentryIssues({
          query,
          statsPeriod,
          limit,
        });

        const issueList = issues.map(issue => 
          `• ${issue.shortId} - ${issue.title}\n  狀態: ${issue.status}\n  平台: ${issue.platform}\n  等級: ${issue.level}\n  發生次數: ${issue.count}\n  首次發生: ${new Date(issue.firstSeen).toLocaleString()}\n  最後發生: ${new Date(issue.lastSeen).toLocaleString()}\n  連結: ${issue.permalink}`
        ).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `找到 ${issues.length} 個 Sentry 問題：\n\n${issueList}`,
            },
          ],
        };
      }

      case 'sentry_get_issue': {
        if (!sentryIntegration) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'Sentry integration is not configured.'
          );
        }

        const { issueId } = args as { issueId: string };

        const issue = await sentryIntegration.getSentryIssue(issueId);

        const tagsText = issue.tags.map(tag => `${tag.key}: ${tag.value}`).join(', ');

        return {
          content: [
            {
              type: 'text',
              text: `Sentry 問題詳細資訊：\n問題 ID: ${issue.id}\n短 ID: ${issue.shortId}\n標題: ${issue.title}\n狀態: ${issue.status}\n平台: ${issue.platform}\n等級: ${issue.level}\n專案: ${issue.project.name}\n錯誤類型: ${issue.metadata.type}\n錯誤訊息: ${issue.metadata.value}\n發生檔案: ${issue.metadata.filename}\n發生函數: ${issue.metadata.function}\n發生次數: ${issue.count}\n受影響用戶: ${issue.userCount}\n首次發生: ${new Date(issue.firstSeen).toLocaleString()}\n最後發生: ${new Date(issue.lastSeen).toLocaleString()}\n標籤: ${tagsText}\n連結: ${issue.permalink}`,
            },
          ],
        };
      }

      case 'sentry_create_gitlab_issue': {
        if (!sentryIntegration) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'Sentry integration is not configured.'
          );
        }

        const { sentryIssueId, gitlabProjectId, assigneeIds, labels, addStackTrace } = args as {
          sentryIssueId: string;
          gitlabProjectId: string;
          assigneeIds?: number[];
          labels?: string[];
          addStackTrace?: boolean;
        };

        const [sentryIssue, gitlabIssue] = await Promise.all([
          sentryIntegration.getSentryIssue(sentryIssueId),
          sentryIntegration.createGitLabIssueFromSentryIssue(
            await sentryIntegration.getSentryIssue(sentryIssueId),
            gitlabProjectId,
            { assigneeIds, labels, addStackTrace }
          ),
        ]);

        const project = await gitlabClient.getProject(gitlabProjectId);
        const issueUrl = gitlabClient.getIssueUrl(project, gitlabIssue);

        return {
          content: [
            {
              type: 'text',
              text: `GitLab 問題創建成功！\n問題 #${gitlabIssue.iid}: ${gitlabIssue.title}\n來源 Sentry 問題: ${sentryIssue.shortId}\n建立時間: ${new Date(gitlabIssue.created_at).toLocaleString()}\nURL: ${issueUrl}`,
            },
          ],
        };
      }

      case 'sentry_create_fix_mr': {
        if (!sentryIntegration) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'Sentry integration is not configured.'
          );
        }

        const { sentryIssueId, gitlabProjectId, sourceBranch, targetBranch, assigneeIds, reviewerIds, labels } = args as {
          sentryIssueId: string;
          gitlabProjectId: string;
          sourceBranch: string;
          targetBranch?: string;
          assigneeIds?: number[];
          reviewerIds?: number[];
          labels?: string[];
        };

        const [sentryIssue, mergeRequest] = await Promise.all([
          sentryIntegration.getSentryIssue(sentryIssueId),
          sentryIntegration.createMergeRequestForSentryFix(
            gitlabProjectId,
            await sentryIntegration.getSentryIssue(sentryIssueId),
            sourceBranch,
            targetBranch,
            { assigneeIds, reviewerIds, labels }
          ),
        ]);

        const project = await gitlabClient.getProject(gitlabProjectId);
        const mrUrl = gitlabClient.getMergeRequestUrl(project, mergeRequest);

        return {
          content: [
            {
              type: 'text',
              text: `GitLab 合併請求創建成功！\n合併請求 !${mergeRequest.iid}: ${mergeRequest.title}\n來源 Sentry 問題: ${sentryIssue.shortId}\n分支: ${mergeRequest.source_branch} → ${mergeRequest.target_branch}\n建立時間: ${new Date(mergeRequest.created_at).toLocaleString()}\nURL: ${mrUrl}`,
            },
          ],
        };
      }

      case 'sentry_analyze_issue': {
        if (!sentryIntegration) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'Sentry integration is not configured.'
          );
        }

        const { sentryIssueId } = args as { sentryIssueId: string };

        const [sentryIssue, analysis] = await Promise.all([
          sentryIntegration.getSentryIssue(sentryIssueId),
          sentryIntegration.generateCodeAnalysisFromSentryIssue(
            await sentryIntegration.getSentryIssue(sentryIssueId)
          ),
        ]);

        return {
          content: [
            {
              type: 'text',
              text: `Sentry 問題分析報告：\n\n${analysis}`,
            },
          ],
        };
      }

      // 檔案和程式碼查看工具
      case 'gitlab_get_file': {
        const { projectId, filePath, ref, raw } = args as {
          projectId: string;
          filePath: string;
          ref?: string;
          raw?: boolean;
        };

        const project = await gitlabClient.getProject(projectId);
        const fileData = await gitlabClient.getRepositoryFile(projectId, filePath, { ref, raw });
        const fileUrl = gitlabClient.getFileUrl(project, filePath, ref || 'main');

        if (raw) {
          // 如果是 raw 模式，直接顯示文字內容
          return {
            content: [
              {
                type: 'text',
                text: `檔案內容 (${filePath}):\n\nURL: ${fileUrl}\n\n${fileData}`,
              },
            ],
          };
        } else {
          // 否則顯示檔案資訊和內容
          const content = fileData.decodedContent || fileData.content;
          const fileInfo = `檔案資訊:\n• 檔案: ${filePath}\n• 分支: ${ref || 'main'}\n• 大小: ${fileData.size || 0} bytes\n• 編碼: ${fileData.encoding || 'unknown'}\n• 最後提交: ${fileData.last_commit_id || 'unknown'}\n• URL: ${fileUrl}\n\n`;
          
          return {
            content: [
              {
                type: 'text',
                text: fileInfo + `檔案內容:\n\n${content}`,
              },
            ],
          };
        }
      }

      case 'gitlab_get_tree': {
        const { projectId, path, ref, recursive } = args as {
          projectId: string;
          path?: string;
          ref?: string;
          recursive?: boolean;
        };

        const tree = await gitlabClient.getRepositoryTree(projectId, { path, ref, recursive });
        const project = await gitlabClient.getProject(projectId);

        const treeDisplay = tree.map(item => {
          const icon = item.type === 'tree' ? '📁' : '📄';
          const typeLabel = item.type === 'tree' ? '目錄' : '檔案';
          return `${icon} ${item.name} (${typeLabel}) - ${item.path}`;
        }).join('\n');

        const pathDisplay = path ? `/${path}` : '/';
        return {
          content: [
            {
              type: 'text',
              text: `專案目錄結構 (${pathDisplay}):\n分支: ${ref || 'main'}\n專案: ${project.name}\n\n${treeDisplay || '(空目錄)'}`,
            },
          ],
        };
      }

      case 'gitlab_search_files': {
        const { projectId, query, ref, per_page } = args as {
          projectId: string;
          query: string;
          ref?: string;
          per_page?: number;
        };

        const results = await gitlabClient.searchRepositoryFiles(projectId, query, { ref, per_page });
        const project = await gitlabClient.getProject(projectId);

        const resultsDisplay = results.map(file => {
          const fileUrl = gitlabClient.getFileUrl(project, file.path, ref || 'main');
          return `📄 ${file.name}\n  路徑: ${file.path}\n  URL: ${fileUrl}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `搜尋結果 (關鍵字: "${query}"):\n分支: ${ref || 'main'}\n找到 ${results.length} 個檔案:\n\n${resultsDisplay || '未找到相符的檔案'}`,
            },
          ],
        };
      }

      case 'gitlab_get_file_blame': {
        const { projectId, filePath, ref } = args as {
          projectId: string;
          filePath: string;
          ref?: string;
        };

        const blameData = await gitlabClient.getFileBlame(projectId, filePath, { ref });
        const project = await gitlabClient.getProject(projectId);
        const fileUrl = gitlabClient.getFileUrl(project, filePath, ref || 'main');

        const blameDisplay = blameData.map((blame, index) => {
          const lineNum = (index + 1).toString().padStart(4, ' ');
          const commit = blame.commit;
          const author = commit.author_name;
          const date = new Date(commit.committed_date).toLocaleDateString();
          const shortSha = commit.id.substring(0, 8);
          return `${lineNum} | ${shortSha} | ${author.padEnd(15)} | ${date} | ${blame.line}`;
        }).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `程式碼責任歸屬 (${filePath}):\n分支: ${ref || 'main'}\nURL: ${fileUrl}\n\n行號 | 提交SHA  | 作者           | 日期       | 程式碼\n${'-'.repeat(80)}\n${blameDisplay}`,
            },
          ],
        };
      }

      case 'gitlab_get_file_history': {
        const { projectId, filePath, ref, per_page } = args as {
          projectId: string;
          filePath: string;
          ref?: string;
          per_page?: number;
        };

        const commits = await gitlabClient.getFileHistory(projectId, filePath, { ref, per_page });
        const project = await gitlabClient.getProject(projectId);
        const fileUrl = gitlabClient.getFileUrl(project, filePath, ref || 'main');

        const historyDisplay = commits.map(commit => {
          const commitUrl = gitlabClient.getCommitUrl(project, commit);
          return `• ${commit.short_id} - ${commit.title}\n  作者: ${commit.author_name}\n  時間: ${new Date(commit.committed_date).toLocaleString()}\n  URL: ${commitUrl}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `檔案修改歷史 (${filePath}):\n分支: ${ref || 'main'}\n檔案URL: ${fileUrl}\n\n找到 ${commits.length} 個相關提交:\n\n${historyDisplay}`,
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      content: [
        {
          type: 'text',
          text: `錯誤: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GitLab MCP server 已啟動');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});