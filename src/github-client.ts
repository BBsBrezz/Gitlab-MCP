import axios, { AxiosInstance } from 'axios';
import { config } from './config.js';
import {
  GitHubRepository,
  GitHubCommit,
  GitHubWorkflowRun,
  GitHubJob,
  GitHubIssue,
  GitHubPullRequest,
  GitHubComment,
  CreateIssueRequest,
  CreatePullRequestRequest,
  CreateCommentRequest,
} from './types.js';

export class GitHubClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private repoCache = new Map<string, { owner: string; repo: string }>();

  constructor() {
    this.baseUrl = config.githubBaseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `token ${config.githubAccessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  }

  parseRepoIdentifier(repoIdentifier: string): { owner: string; repo: string } {
    // 檢查緩存
    if (this.repoCache.has(repoIdentifier)) {
      return this.repoCache.get(repoIdentifier)!;
    }

    // 解析 owner/repo 格式
    const parts = repoIdentifier.split('/');
    if (parts.length !== 2) {
      throw new Error(`Invalid repository identifier: ${repoIdentifier}. Expected format: owner/repo`);
    }

    const result = { owner: parts[0], repo: parts[1] };
    this.repoCache.set(repoIdentifier, result);
    return result;
  }

  async getRepositories(options: {
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
  } = {}): Promise<GitHubRepository[]> {
    const params = {
      per_page: options.per_page || 20,
      type: options.type || 'owner',
      sort: options.sort || 'updated',
      direction: options.direction || 'desc',
    };

    const response = await this.client.get('/user/repos', { params });
    return response.data;
  }

  async getRepository(repoIdentifier: string): Promise<GitHubRepository> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.get(`/repos/${owner}/${repo}`);
    return response.data;
  }

  async getCommits(repoIdentifier: string, options: {
    sha?: string;
    path?: string;
    author?: string;
    since?: string;
    until?: string;
    per_page?: number;
  } = {}): Promise<GitHubCommit[]> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const params = {
      per_page: options.per_page || 20,
      sha: options.sha,
      path: options.path,
      author: options.author,
      since: options.since,
      until: options.until,
    };

    const response = await this.client.get(`/repos/${owner}/${repo}/commits`, { params });
    return response.data;
  }

  async getCommit(repoIdentifier: string, sha: string): Promise<GitHubCommit> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.get(`/repos/${owner}/${repo}/commits/${sha}`);
    return response.data;
  }

  async getWorkflowRuns(repoIdentifier: string, options: {
    actor?: string;
    branch?: string;
    event?: string;
    status?: 'completed' | 'action_required' | 'cancelled' | 'failure' | 'neutral' | 'skipped' | 'stale' | 'success' | 'timed_out' | 'in_progress' | 'queued' | 'requested' | 'waiting';
    per_page?: number;
  } = {}): Promise<GitHubWorkflowRun[]> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const params = {
      per_page: options.per_page || 20,
      actor: options.actor,
      branch: options.branch,
      event: options.event,
      status: options.status,
    };

    const response = await this.client.get(`/repos/${owner}/${repo}/actions/runs`, { params });
    return response.data.workflow_runs;
  }

  async getWorkflowRun(repoIdentifier: string, runId: number): Promise<GitHubWorkflowRun> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.get(`/repos/${owner}/${repo}/actions/runs/${runId}`);
    return response.data;
  }

  async getWorkflowRunJobs(repoIdentifier: string, runId: number): Promise<GitHubJob[]> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.get(`/repos/${owner}/${repo}/actions/runs/${runId}/jobs`);
    return response.data.jobs;
  }

  async getJobLogs(repoIdentifier: string, jobId: number): Promise<string> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.get(`/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`, {
      responseType: 'text',
    });
    return response.data;
  }

  async getIssues(repoIdentifier: string, options: {
    state?: 'open' | 'closed' | 'all';
    labels?: string[];
    sort?: 'created' | 'updated' | 'comments';
    direction?: 'asc' | 'desc';
    since?: string;
    per_page?: number;
  } = {}): Promise<GitHubIssue[]> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const params = {
      per_page: options.per_page || 20,
      state: options.state || 'open',
      labels: options.labels?.join(','),
      sort: options.sort || 'created',
      direction: options.direction || 'desc',
      since: options.since,
    };

    const response = await this.client.get(`/repos/${owner}/${repo}/issues`, { params });
    // GitHub API 的 issues 端點包含 pull requests，需要過濾掉
    return response.data.filter((issue: any) => !issue.pull_request);
  }

  async getIssue(repoIdentifier: string, issueNumber: number): Promise<GitHubIssue> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.get(`/repos/${owner}/${repo}/issues/${issueNumber}`);
    return response.data;
  }

  async createIssue(repoIdentifier: string, issueData: CreateIssueRequest): Promise<GitHubIssue> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.post(`/repos/${owner}/${repo}/issues`, issueData);
    return response.data;
  }

  async updateIssue(repoIdentifier: string, issueNumber: number, issueData: Partial<CreateIssueRequest>): Promise<GitHubIssue> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.patch(`/repos/${owner}/${repo}/issues/${issueNumber}`, issueData);
    return response.data;
  }

  async getPullRequests(repoIdentifier: string, options: {
    state?: 'open' | 'closed' | 'all';
    head?: string;
    base?: string;
    sort?: 'created' | 'updated' | 'popularity' | 'long-running';
    direction?: 'asc' | 'desc';
    per_page?: number;
  } = {}): Promise<GitHubPullRequest[]> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const params = {
      per_page: options.per_page || 20,
      state: options.state || 'open',
      head: options.head,
      base: options.base,
      sort: options.sort || 'created',
      direction: options.direction || 'desc',
    };

    const response = await this.client.get(`/repos/${owner}/${repo}/pulls`, { params });
    return response.data;
  }

  async getPullRequest(repoIdentifier: string, pullNumber: number): Promise<GitHubPullRequest> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.get(`/repos/${owner}/${repo}/pulls/${pullNumber}`);
    return response.data;
  }

  async createPullRequest(repoIdentifier: string, prData: CreatePullRequestRequest): Promise<GitHubPullRequest> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.post(`/repos/${owner}/${repo}/pulls`, prData);
    return response.data;
  }

  async updatePullRequest(repoIdentifier: string, pullNumber: number, prData: Partial<CreatePullRequestRequest>): Promise<GitHubPullRequest> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.patch(`/repos/${owner}/${repo}/pulls/${pullNumber}`, prData);
    return response.data;
  }

  async mergePullRequest(repoIdentifier: string, pullNumber: number, options: {
    commit_title?: string;
    commit_message?: string;
    merge_method?: 'merge' | 'squash' | 'rebase';
  } = {}): Promise<any> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.put(`/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, options);
    return response.data;
  }

  async getPullRequestFiles(repoIdentifier: string, pullNumber: number): Promise<any[]> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.get(`/repos/${owner}/${repo}/pulls/${pullNumber}/files`);
    return response.data;
  }

  async getUser(): Promise<any> {
    const response = await this.client.get('/user');
    return response.data;
  }

  async getRepositoryCollaborators(repoIdentifier: string): Promise<any[]> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.get(`/repos/${owner}/${repo}/collaborators`);
    return response.data;
  }

  getRepositoryUrl(repository: GitHubRepository): string {
    return repository.html_url;
  }

  getCommitUrl(repository: GitHubRepository, commit: GitHubCommit): string {
    return `${repository.html_url}/commit/${commit.sha}`;
  }

  getWorkflowRunUrl(repository: GitHubRepository, run: GitHubWorkflowRun): string {
    return `${repository.html_url}/actions/runs/${run.id}`;
  }

  getIssueUrl(repository: GitHubRepository, issue: GitHubIssue): string {
    return `${repository.html_url}/issues/${issue.number}`;
  }

  getPullRequestUrl(repository: GitHubRepository, pullRequest: GitHubPullRequest): string {
    return `${repository.html_url}/pull/${pullRequest.number}`;
  }

  // 文件和代碼相關方法
  async getRepositoryContent(repoIdentifier: string, path: string = '', options: {
    ref?: string;
  } = {}): Promise<any> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const params = {
      ref: options.ref,
    };

    const response = await this.client.get(`/repos/${owner}/${repo}/contents/${path}`, { params });
    return response.data;
  }

  async getFileContent(repoIdentifier: string, filePath: string, options: {
    ref?: string;
  } = {}): Promise<string> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const params = {
      ref: options.ref,
    };

    const response = await this.client.get(`/repos/${owner}/${repo}/contents/${filePath}`, { params });
    const fileData = response.data;

    // 解碼 base64 內容
    if (fileData.encoding === 'base64' && fileData.content) {
      return Buffer.from(fileData.content, 'base64').toString('utf-8');
    }

    return fileData.content || '';
  }

  async searchCode(repoIdentifier: string, query: string, options: {
    per_page?: number;
  } = {}): Promise<any[]> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const params = {
      q: `${query} repo:${owner}/${repo}`,
      per_page: options.per_page || 30,
    };

    const response = await this.client.get('/search/code', { params });
    return response.data.items;
  }

  getFileUrl(repository: GitHubRepository, filePath: string, ref: string = 'main'): string {
    return `${repository.html_url}/blob/${ref}/${filePath}`;
  }

  // Pull Request 評論相關方法
  async getPullRequestComments(repoIdentifier: string, pullNumber: number, options: {
    sort?: 'created' | 'updated';
    direction?: 'asc' | 'desc';
    per_page?: number;
  } = {}): Promise<GitHubComment[]> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const params = {
      sort: options.sort || 'created',
      direction: options.direction || 'asc',
      per_page: options.per_page || 100,
    };

    const response = await this.client.get(`/repos/${owner}/${repo}/issues/${pullNumber}/comments`, { params });
    return response.data;
  }

  async createPullRequestComment(repoIdentifier: string, pullNumber: number, commentData: CreateCommentRequest): Promise<GitHubComment> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.post(`/repos/${owner}/${repo}/issues/${pullNumber}/comments`, commentData);
    return response.data;
  }

  async updatePullRequestComment(repoIdentifier: string, commentId: number, commentData: Partial<CreateCommentRequest>): Promise<GitHubComment> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.patch(`/repos/${owner}/${repo}/issues/comments/${commentId}`, commentData);
    return response.data;
  }

  async deletePullRequestComment(repoIdentifier: string, commentId: number): Promise<void> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    await this.client.delete(`/repos/${owner}/${repo}/issues/comments/${commentId}`);
  }

  // Issue 評論相關方法
  async getIssueComments(repoIdentifier: string, issueNumber: number, options: {
    sort?: 'created' | 'updated';
    direction?: 'asc' | 'desc';
    per_page?: number;
  } = {}): Promise<GitHubComment[]> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const params = {
      sort: options.sort || 'created',
      direction: options.direction || 'asc',
      per_page: options.per_page || 100,
    };

    const response = await this.client.get(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, { params });
    return response.data;
  }

  async createIssueComment(repoIdentifier: string, issueNumber: number, commentData: CreateCommentRequest): Promise<GitHubComment> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const response = await this.client.post(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, commentData);
    return response.data;
  }

  getCommentUrl(comment: GitHubComment): string {
    return comment.html_url;
  }
}
