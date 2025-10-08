#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { GitHubClient } from './github-client.js';
import { config } from './config.js';

const server = new Server(
  {
    name: 'github-mcp',
    version: '1.0.0',
  }
);

const githubClient = new GitHubClient();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'github_get_repositories',
        description: '獲取 GitHub 倉庫列表',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: '倉庫類型',
              enum: ['all', 'owner', 'public', 'private', 'member'],
              default: 'owner',
            },
            sort: {
              type: 'string',
              description: '排序方式',
              enum: ['created', 'updated', 'pushed', 'full_name'],
              default: 'updated',
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
        name: 'github_get_repository',
        description: '獲取特定倉庫的詳細資訊',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo，例如: "octocat/Hello-World")',
            },
          },
          required: ['repository'],
        },
      },
      {
        name: 'github_get_commits',
        description: '獲取倉庫的提交歷史',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            sha: {
              type: 'string',
              description: '分支名稱或提交 SHA',
            },
            since: {
              type: 'string',
              description: '起始時間 (ISO 8601 格式)',
            },
            until: {
              type: 'string',
              description: '結束時間 (ISO 8601 格式)',
            },
            per_page: {
              type: 'number',
              description: '每頁顯示數量',
              default: 20,
            },
          },
          required: ['repository'],
        },
      },
      {
        name: 'github_get_commit',
        description: '獲取特定提交的詳細資訊',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            sha: {
              type: 'string',
              description: '提交的 SHA 值',
            },
          },
          required: ['repository', 'sha'],
        },
      },
      {
        name: 'github_get_workflow_runs',
        description: '獲取倉庫的 GitHub Actions 工作流運行',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            status: {
              type: 'string',
              description: '運行狀態',
              enum: ['completed', 'in_progress', 'queued', 'requested', 'waiting'],
            },
            branch: {
              type: 'string',
              description: '分支名稱',
            },
            per_page: {
              type: 'number',
              description: '每頁顯示數量',
              default: 20,
            },
          },
          required: ['repository'],
        },
      },
      {
        name: 'github_get_workflow_run',
        description: '獲取特定工作流運行的詳細資訊',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            runId: {
              type: 'number',
              description: '工作流運行 ID',
            },
          },
          required: ['repository', 'runId'],
        },
      },
      {
        name: 'github_get_workflow_run_jobs',
        description: '獲取工作流運行的任務列表',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            runId: {
              type: 'number',
              description: '工作流運行 ID',
            },
          },
          required: ['repository', 'runId'],
        },
      },
      {
        name: 'github_get_job_logs',
        description: '獲取工作流任務的日誌',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            jobId: {
              type: 'number',
              description: '任務 ID',
            },
          },
          required: ['repository', 'jobId'],
        },
      },
      {
        name: 'github_get_issues',
        description: '獲取倉庫的問題列表',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            state: {
              type: 'string',
              description: '問題狀態',
              enum: ['open', 'closed', 'all'],
              default: 'open',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: '標籤列表',
            },
            per_page: {
              type: 'number',
              description: '每頁顯示數量',
              default: 20,
            },
          },
          required: ['repository'],
        },
      },
      {
        name: 'github_get_issue',
        description: '獲取特定問題的詳細資訊',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            issueNumber: {
              type: 'number',
              description: '問題編號',
            },
          },
          required: ['repository', 'issueNumber'],
        },
      },
      {
        name: 'github_create_issue',
        description: '創建新問題',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            title: {
              type: 'string',
              description: '問題標題',
            },
            body: {
              type: 'string',
              description: '問題描述',
            },
            assignees: {
              type: 'array',
              items: { type: 'string' },
              description: '指派給用戶的用戶名列表',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: '標籤列表',
            },
          },
          required: ['repository', 'title'],
        },
      },
      {
        name: 'github_get_pull_requests',
        description: '獲取 Pull Request 列表',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            state: {
              type: 'string',
              description: 'Pull Request 狀態',
              enum: ['open', 'closed', 'all'],
              default: 'open',
            },
            head: {
              type: 'string',
              description: '源分支 (格式: user:ref-name)',
            },
            base: {
              type: 'string',
              description: '目標分支',
            },
            per_page: {
              type: 'number',
              description: '每頁顯示數量',
              default: 20,
            },
          },
          required: ['repository'],
        },
      },
      {
        name: 'github_get_pull_request',
        description: '獲取特定 Pull Request 的詳細資訊',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            pullNumber: {
              type: 'number',
              description: 'Pull Request 編號',
            },
          },
          required: ['repository', 'pullNumber'],
        },
      },
      {
        name: 'github_create_pull_request',
        description: '創建新的 Pull Request',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            title: {
              type: 'string',
              description: 'Pull Request 標題',
            },
            head: {
              type: 'string',
              description: '源分支名稱',
            },
            base: {
              type: 'string',
              description: '目標分支名稱',
            },
            body: {
              type: 'string',
              description: 'Pull Request 描述',
            },
            draft: {
              type: 'boolean',
              description: '是否為草稿',
              default: false,
            },
          },
          required: ['repository', 'title', 'head', 'base'],
        },
      },
      {
        name: 'github_get_pr_files',
        description: '獲取 Pull Request 的文件變更',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            pullNumber: {
              type: 'number',
              description: 'Pull Request 編號',
            },
          },
          required: ['repository', 'pullNumber'],
        },
      },
      {
        name: 'github_get_pr_comments',
        description: '獲取 Pull Request 的評論列表',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            pullNumber: {
              type: 'number',
              description: 'Pull Request 編號',
            },
            per_page: {
              type: 'number',
              description: '每頁顯示數量 (預設 100)',
              default: 100,
            },
          },
          required: ['repository', 'pullNumber'],
        },
      },
      {
        name: 'github_create_pr_comment',
        description: '在 Pull Request 中發表評論',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            pullNumber: {
              type: 'number',
              description: 'Pull Request 編號',
            },
            body: {
              type: 'string',
              description: '評論內容',
            },
          },
          required: ['repository', 'pullNumber', 'body'],
        },
      },
      {
        name: 'github_get_issue_comments',
        description: '獲取問題的評論列表',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            issueNumber: {
              type: 'number',
              description: '問題編號',
            },
            per_page: {
              type: 'number',
              description: '每頁顯示數量 (預設 100)',
              default: 100,
            },
          },
          required: ['repository', 'issueNumber'],
        },
      },
      {
        name: 'github_create_issue_comment',
        description: '在問題中發表評論',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            issueNumber: {
              type: 'number',
              description: '問題編號',
            },
            body: {
              type: 'string',
              description: '評論內容',
            },
          },
          required: ['repository', 'issueNumber', 'body'],
        },
      },
      {
        name: 'github_get_file_content',
        description: '讀取倉庫中的特定文件內容',
        inputSchema: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
              description: '倉庫標識 (格式: owner/repo)',
            },
            filePath: {
              type: 'string',
              description: '文件路徑 (例如: src/index.js)',
            },
            ref: {
              type: 'string',
              description: '分支或提交 SHA (預設: main)',
              default: 'main',
            },
          },
          required: ['repository', 'filePath'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'github_get_repositories': {
        const { type, sort, per_page } = args as {
          type?: 'all' | 'owner' | 'public' | 'private' | 'member';
          sort?: 'created' | 'updated' | 'pushed' | 'full_name';
          per_page?: number;
        };

        const repos = await githubClient.getRepositories({ type, sort, per_page });

        const repoList = repos.map(repo =>
          `• ${repo.full_name}\n  描述: ${repo.description || '無描述'}\n  星標數: ${repo.stargazers_count}\n  語言: ${repo.language || 'N/A'}\n  最後更新: ${new Date(repo.updated_at).toLocaleDateString()}\n  URL: ${repo.html_url}`
        ).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `找到 ${repos.length} 個倉庫：\n\n${repoList}`,
            },
          ],
        };
      }

      case 'github_get_repository': {
        const { repository } = args as { repository: string };

        const repo = await githubClient.getRepository(repository);

        return {
          content: [
            {
              type: 'text',
              text: `倉庫資訊：\n倉庫名稱: ${repo.full_name}\n擁有者: ${repo.owner.login}\n描述: ${repo.description || '無描述'}\n預設分支: ${repo.default_branch}\n可見性: ${repo.visibility}\n建立時間: ${new Date(repo.created_at).toLocaleString()}\n最後更新: ${new Date(repo.updated_at).toLocaleString()}\n星標數: ${repo.stargazers_count}\n分支數: ${repo.forks_count}\nIssues: ${repo.has_issues ? '啟用' : '禁用'}\nURL: ${repo.html_url}`,
            },
          ],
        };
      }

      case 'github_get_commits': {
        const { repository, sha, since, until, per_page } = args as {
          repository: string;
          sha?: string;
          since?: string;
          until?: string;
          per_page?: number;
        };

        const commits = await githubClient.getCommits(repository, { sha, since, until, per_page });
        const repo = await githubClient.getRepository(repository);

        const commitList = commits.map(commit => {
          const commitUrl = githubClient.getCommitUrl(repo, commit);
          return `• ${commit.sha.substring(0, 7)} - ${commit.commit.message.split('\n')[0]}\n  作者: ${commit.commit.author.name}\n  時間: ${new Date(commit.commit.author.date).toLocaleString()}\n  URL: ${commitUrl}`;
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

      case 'github_get_commit': {
        const { repository, sha } = args as { repository: string; sha: string };

        const commit = await githubClient.getCommit(repository, sha);
        const repo = await githubClient.getRepository(repository);
        const commitUrl = githubClient.getCommitUrl(repo, commit);

        const stats = commit.stats ? `\n統計: +${commit.stats.additions} -${commit.stats.deletions} (總計 ${commit.stats.total})` : '';

        return {
          content: [
            {
              type: 'text',
              text: `提交詳細資訊：\n提交 SHA: ${commit.sha}\n作者: ${commit.commit.author.name} (${commit.commit.author.email})\n提交者: ${commit.commit.committer.name} (${commit.commit.committer.email})\n作者時間: ${new Date(commit.commit.author.date).toLocaleString()}\n提交時間: ${new Date(commit.commit.committer.date).toLocaleString()}${stats}\nURL: ${commitUrl}\n\n提交訊息:\n${commit.commit.message}`,
            },
          ],
        };
      }

      case 'github_get_workflow_runs': {
        const { repository, status, branch, per_page } = args as {
          repository: string;
          status?: string;
          branch?: string;
          per_page?: number;
        };

        const runs = await githubClient.getWorkflowRuns(repository, { status: status as any, branch, per_page });
        const repo = await githubClient.getRepository(repository);

        const runList = runs.map(run => {
          const runUrl = githubClient.getWorkflowRunUrl(repo, run);
          return `• Run #${run.run_number} - ${run.name}\n  狀態: ${run.status} (${run.conclusion || 'N/A'})\n  分支: ${run.head_branch}\n  建立時間: ${new Date(run.created_at).toLocaleString()}\n  URL: ${runUrl}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `找到 ${runs.length} 個工作流運行：\n\n${runList}`,
            },
          ],
        };
      }

      case 'github_get_workflow_run': {
        const { repository, runId } = args as { repository: string; runId: number };

        const run = await githubClient.getWorkflowRun(repository, runId);
        const repo = await githubClient.getRepository(repository);
        const runUrl = githubClient.getWorkflowRunUrl(repo, run);

        return {
          content: [
            {
              type: 'text',
              text: `工作流運行詳細資訊：\nRun ID: ${run.id}\nRun Number: ${run.run_number}\n工作流: ${run.name}\n狀態: ${run.status}\n結論: ${run.conclusion || 'N/A'}\n分支: ${run.head_branch}\n提交: ${run.head_sha.substring(0, 7)}\n建立時間: ${new Date(run.created_at).toLocaleString()}\n更新時間: ${new Date(run.updated_at).toLocaleString()}\nURL: ${runUrl}`,
            },
          ],
        };
      }

      case 'github_get_workflow_run_jobs': {
        const { repository, runId } = args as { repository: string; runId: number };

        const jobs = await githubClient.getWorkflowRunJobs(repository, runId);

        const jobList = jobs.map(job => {
          return `• ${job.name} - ${job.status}\n  結論: ${job.conclusion || 'N/A'}\n  開始時間: ${new Date(job.started_at).toLocaleString()}\n  URL: ${job.html_url}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `找到 ${jobs.length} 個任務：\n\n${jobList}`,
            },
          ],
        };
      }

      case 'github_get_job_logs': {
        const { repository, jobId } = args as { repository: string; jobId: number };

        const logs = await githubClient.getJobLogs(repository, jobId);

        const logPreview = logs.length > 2000 ? `${logs.substring(0, 2000)}...\n\n[日誌已截斷]` : logs;

        return {
          content: [
            {
              type: 'text',
              text: `任務日誌：\n\n${logPreview}`,
            },
          ],
        };
      }

      case 'github_get_issues': {
        const { repository, state, labels, per_page } = args as {
          repository: string;
          state?: string;
          labels?: string[];
          per_page?: number;
        };

        const issues = await githubClient.getIssues(repository, { state: state as any, labels, per_page });
        const repo = await githubClient.getRepository(repository);

        const issueList = issues.map(issue => {
          const issueUrl = githubClient.getIssueUrl(repo, issue);
          const labelsText = issue.labels.length > 0 ? `\n  標籤: ${issue.labels.map(l => l.name).join(', ')}` : '';
          return `• #${issue.number} - ${issue.title}\n  狀態: ${issue.state}\n  作者: ${issue.user.login}\n  建立時間: ${new Date(issue.created_at).toLocaleString()}${labelsText}\n  URL: ${issueUrl}`;
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

      case 'github_get_issue': {
        const { repository, issueNumber } = args as { repository: string; issueNumber: number };

        const issue = await githubClient.getIssue(repository, issueNumber);
        const repo = await githubClient.getRepository(repository);
        const issueUrl = githubClient.getIssueUrl(repo, issue);

        const labelsText = issue.labels.length > 0 ? `\n標籤: ${issue.labels.map(l => l.name).join(', ')}` : '';
        const assigneesText = issue.assignees.length > 0 ? `\n指派給: ${issue.assignees.map(a => a.login).join(', ')}` : '';

        return {
          content: [
            {
              type: 'text',
              text: `問題詳細資訊：\n問題 #${issue.number}: ${issue.title}\n狀態: ${issue.state}\n作者: ${issue.user.login}\n建立時間: ${new Date(issue.created_at).toLocaleString()}\n更新時間: ${new Date(issue.updated_at).toLocaleString()}${labelsText}${assigneesText}\n評論數: ${issue.comments}\nURL: ${issueUrl}\n\n描述:\n${issue.body || '無描述'}`,
            },
          ],
        };
      }

      case 'github_create_issue': {
        const { repository, title, body, assignees, labels } = args as {
          repository: string;
          title: string;
          body?: string;
          assignees?: string[];
          labels?: string[];
        };

        const issue = await githubClient.createIssue(repository, { title, body, assignees, labels });
        const repo = await githubClient.getRepository(repository);
        const issueUrl = githubClient.getIssueUrl(repo, issue);

        return {
          content: [
            {
              type: 'text',
              text: `問題建立成功！\n問題 #${issue.number}: ${issue.title}\n作者: ${issue.user.login}\n建立時間: ${new Date(issue.created_at).toLocaleString()}\nURL: ${issueUrl}`,
            },
          ],
        };
      }

      case 'github_get_pull_requests': {
        const { repository, state, head, base, per_page } = args as {
          repository: string;
          state?: string;
          head?: string;
          base?: string;
          per_page?: number;
        };

        const prs = await githubClient.getPullRequests(repository, { state: state as any, head, base, per_page });
        const repo = await githubClient.getRepository(repository);

        const prList = prs.map(pr => {
          const prUrl = githubClient.getPullRequestUrl(repo, pr);
          const labelsText = pr.labels.length > 0 ? `\n  標籤: ${pr.labels.map(l => l.name).join(', ')}` : '';
          return `• #${pr.number} - ${pr.title}\n  狀態: ${pr.state}${pr.draft ? ' (草稿)' : ''}\n  分支: ${pr.head.ref} → ${pr.base.ref}\n  作者: ${pr.user.login}\n  建立時間: ${new Date(pr.created_at).toLocaleString()}${labelsText}\n  URL: ${prUrl}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `找到 ${prs.length} 個 Pull Request：\n\n${prList}`,
            },
          ],
        };
      }

      case 'github_get_pull_request': {
        const { repository, pullNumber } = args as { repository: string; pullNumber: number };

        const pr = await githubClient.getPullRequest(repository, pullNumber);
        const repo = await githubClient.getRepository(repository);
        const prUrl = githubClient.getPullRequestUrl(repo, pr);

        const labelsText = pr.labels.length > 0 ? `\n標籤: ${pr.labels.map(l => l.name).join(', ')}` : '';
        const assigneesText = pr.assignees.length > 0 ? `\n指派給: ${pr.assignees.map(a => a.login).join(', ')}` : '';

        return {
          content: [
            {
              type: 'text',
              text: `Pull Request 詳細資訊：\nPR #${pr.number}: ${pr.title}\n狀態: ${pr.state}${pr.draft ? ' (草稿)' : ''}\n合併狀態: ${pr.merged ? '已合併' : pr.mergeable ? '可合併' : '有衝突'}\n分支: ${pr.head.ref} → ${pr.base.ref}\n作者: ${pr.user.login}\n建立時間: ${new Date(pr.created_at).toLocaleString()}\n更新時間: ${new Date(pr.updated_at).toLocaleString()}${labelsText}${assigneesText}\n評論數: ${pr.comments}\n變更: +${pr.additions} -${pr.deletions} (${pr.changed_files} 個文件)\nURL: ${prUrl}\n\n描述:\n${pr.body || '無描述'}`,
            },
          ],
        };
      }

      case 'github_create_pull_request': {
        const { repository, title, head, base, body, draft } = args as {
          repository: string;
          title: string;
          head: string;
          base: string;
          body?: string;
          draft?: boolean;
        };

        const pr = await githubClient.createPullRequest(repository, { title, head, base, body, draft });
        const repo = await githubClient.getRepository(repository);
        const prUrl = githubClient.getPullRequestUrl(repo, pr);

        return {
          content: [
            {
              type: 'text',
              text: `Pull Request 建立成功！\nPR #${pr.number}: ${pr.title}\n分支: ${pr.head.ref} → ${pr.base.ref}\n作者: ${pr.user.login}\n建立時間: ${new Date(pr.created_at).toLocaleString()}\nURL: ${prUrl}`,
            },
          ],
        };
      }

      case 'github_get_pr_files': {
        const { repository, pullNumber } = args as { repository: string; pullNumber: number };

        const files = await githubClient.getPullRequestFiles(repository, pullNumber);

        const fileList = files.map(file => {
          const changeType = file.status === 'added' ? '新增' : file.status === 'removed' ? '刪除' : file.status === 'modified' ? '修改' : file.status;
          return `• ${changeType}: ${file.filename}\n  變更: +${file.additions} -${file.deletions}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Pull Request 文件變更 (${files.length} 個文件):\n\n${fileList}`,
            },
          ],
        };
      }

      case 'github_get_pr_comments': {
        const { repository, pullNumber, per_page } = args as {
          repository: string;
          pullNumber: number;
          per_page?: number;
        };

        const comments = await githubClient.getPullRequestComments(repository, pullNumber, { per_page });

        const commentList = comments.map(comment => {
          return `• 評論 #${comment.id}\n  作者: ${comment.user.login}\n  時間: ${new Date(comment.created_at).toLocaleString()}\n  內容: ${comment.body}\n  URL: ${comment.html_url}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Pull Request #${pullNumber} 的評論 (${comments.length} 則):\n\n${commentList || '沒有評論'}`,
            },
          ],
        };
      }

      case 'github_create_pr_comment': {
        const { repository, pullNumber, body } = args as {
          repository: string;
          pullNumber: number;
          body: string;
        };

        const comment = await githubClient.createPullRequestComment(repository, pullNumber, { body });

        return {
          content: [
            {
              type: 'text',
              text: `評論發表成功！\n評論 #${comment.id}\nPull Request: #${pullNumber}\n作者: ${comment.user.login}\n時間: ${new Date(comment.created_at).toLocaleString()}\nURL: ${comment.html_url}\n\n內容:\n${comment.body}`,
            },
          ],
        };
      }

      case 'github_get_issue_comments': {
        const { repository, issueNumber, per_page } = args as {
          repository: string;
          issueNumber: number;
          per_page?: number;
        };

        const comments = await githubClient.getIssueComments(repository, issueNumber, { per_page });

        const commentList = comments.map(comment => {
          return `• 評論 #${comment.id}\n  作者: ${comment.user.login}\n  時間: ${new Date(comment.created_at).toLocaleString()}\n  內容: ${comment.body}\n  URL: ${comment.html_url}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `問題 #${issueNumber} 的評論 (${comments.length} 則):\n\n${commentList || '沒有評論'}`,
            },
          ],
        };
      }

      case 'github_create_issue_comment': {
        const { repository, issueNumber, body } = args as {
          repository: string;
          issueNumber: number;
          body: string;
        };

        const comment = await githubClient.createIssueComment(repository, issueNumber, { body });

        return {
          content: [
            {
              type: 'text',
              text: `評論發表成功！\n評論 #${comment.id}\n問題: #${issueNumber}\n作者: ${comment.user.login}\n時間: ${new Date(comment.created_at).toLocaleString()}\nURL: ${comment.html_url}\n\n內容:\n${comment.body}`,
            },
          ],
        };
      }

      case 'github_get_file_content': {
        const { repository, filePath, ref } = args as {
          repository: string;
          filePath: string;
          ref?: string;
        };

        const content = await githubClient.getFileContent(repository, filePath, { ref });
        const repo = await githubClient.getRepository(repository);
        const fileUrl = githubClient.getFileUrl(repo, filePath, ref || 'main');

        return {
          content: [
            {
              type: 'text',
              text: `文件內容 (${filePath}):\n分支: ${ref || 'main'}\nURL: ${fileUrl}\n\n${content}`,
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
  console.error('GitHub MCP server 已啟動');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
