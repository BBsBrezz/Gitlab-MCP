import axios, { AxiosInstance } from 'axios';
import { config } from './config.js';
import {
  GitLabProject,
  GitLabCommit,
  GitLabPipeline,
  GitLabJob,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabNote,
  CreateIssueRequest,
  CreateMergeRequestRequest,
  CreateNoteRequest,
} from './types.js';

export class GitLabClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private projectCache = new Map<string, number>();

  constructor() {
    this.baseUrl = config.gitlabBaseUrl;
    this.client = axios.create({
      baseURL: `${this.baseUrl}/api/v4`,
      headers: {
        'Private-Token': config.gitlabAccessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  async resolveProjectId(projectIdOrName: string | number): Promise<number> {
    // 如果已經是數字，直接返回
    if (typeof projectIdOrName === 'number') {
      return projectIdOrName;
    }
    
    // 如果是字符串但看起來像數字，轉換為數字
    if (/^\d+$/.test(projectIdOrName)) {
      return parseInt(projectIdOrName, 10);
    }
    
    // 檢查緩存
    if (this.projectCache.has(projectIdOrName)) {
      return this.projectCache.get(projectIdOrName)!;
    }
    
    // 嘗試直接使用路徑存取 (如 "group/project")
    try {
      const encodedProjectId = encodeURIComponent(projectIdOrName);
      const response = await this.client.get(`/projects/${encodedProjectId}`);
      const project = response.data as GitLabProject;
      this.projectCache.set(projectIdOrName, project.id);
      return project.id;
    } catch (error) {
      // 如果直接存取失敗，搜尋專案
      console.error(`Direct access failed for ${projectIdOrName}, trying search...`);
    }
    
    // 搜尋專案
    try {
      const projects = await this.getProjects({ search: projectIdOrName, per_page: 50 });
      
      // 優先尋找完全匹配的專案名稱
      let project = projects.find(p => 
        p.name === projectIdOrName || 
        p.path === projectIdOrName || 
        p.path_with_namespace === projectIdOrName
      );
      
      // 如果找不到完全匹配，嘗試模糊匹配
      if (!project && projects.length > 0) {
        project = projects.find(p => 
          p.name.toLowerCase().includes(projectIdOrName.toLowerCase()) ||
          p.path.toLowerCase().includes(projectIdOrName.toLowerCase())
        );
      }
      
      if (!project && projects.length > 0) {
        // 如果還是找不到，使用第一個搜尋結果
        project = projects[0];
        console.warn(`No exact match found for "${projectIdOrName}", using: ${project.path_with_namespace}`);
      }
      
      if (!project) {
        throw new Error(`無法找到專案: ${projectIdOrName}`);
      }
      
      this.projectCache.set(projectIdOrName, project.id);
      return project.id;
    } catch (error) {
      throw new Error(`無法解析專案 "${projectIdOrName}": ${error instanceof Error ? error.message : error}`);
    }
  }

  async getProjects(options: { 
    owned?: boolean; 
    starred?: boolean; 
    simple?: boolean; 
    search?: string;
    per_page?: number;
  } = {}): Promise<GitLabProject[]> {
    const params = {
      per_page: options.per_page || 20,
      owned: options.owned || false,
      starred: options.starred || false,
      simple: options.simple || false,
      search: options.search,
    };

    const response = await this.client.get('/projects', { params });
    return response.data;
  }

  async getProject(projectId: number | string): Promise<GitLabProject> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}`);
    return response.data;
  }

  async getCommits(projectId: number | string, options: {
    ref_name?: string;
    since?: string;
    until?: string;
    path?: string;
    per_page?: number;
    with_stats?: boolean;
  } = {}): Promise<GitLabCommit[]> {
    const resolvedId = await this.resolveProjectId(projectId);
    const params = {
      per_page: options.per_page || 20,
      ref_name: options.ref_name,
      since: options.since,
      until: options.until,
      path: options.path,
      with_stats: options.with_stats || false,
    };

    const response = await this.client.get(`/projects/${resolvedId}/repository/commits`, { params });
    return response.data;
  }

  async getCommit(projectId: number | string, sha: string): Promise<GitLabCommit> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}/repository/commits/${sha}`, {
      params: { stats: true }
    });
    return response.data;
  }

  async getCommitDiff(projectId: number | string, sha: string): Promise<any[]> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}/repository/commits/${sha}/diff`);
    return response.data;
  }

  async getPipelines(projectId: number | string, options: {
    scope?: string;
    status?: string;
    ref?: string;
    sha?: string;
    yaml_errors?: boolean;
    username?: string;
    updated_after?: string;
    updated_before?: string;
    order_by?: string;
    sort?: string;
    per_page?: number;
  } = {}): Promise<GitLabPipeline[]> {
    const resolvedId = await this.resolveProjectId(projectId);
    const params = {
      per_page: options.per_page || 20,
      scope: options.scope,
      status: options.status,
      ref: options.ref,
      sha: options.sha,
      yaml_errors: options.yaml_errors,
      username: options.username,
      updated_after: options.updated_after,
      updated_before: options.updated_before,
      order_by: options.order_by || 'id',
      sort: options.sort || 'desc',
    };

    const response = await this.client.get(`/projects/${resolvedId}/pipelines`, { params });
    return response.data;
  }

  async getPipeline(projectId: number | string, pipelineId: number): Promise<GitLabPipeline> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}/pipelines/${pipelineId}`);
    return response.data;
  }

  async getPipelineJobs(projectId: number | string, pipelineId: number): Promise<GitLabJob[]> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}/pipelines/${pipelineId}/jobs`);
    return response.data;
  }

  async getJob(projectId: number | string, jobId: number): Promise<GitLabJob> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}/jobs/${jobId}`);
    return response.data;
  }

  async getJobLog(projectId: number | string, jobId: number): Promise<string> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}/jobs/${jobId}/trace`);
    return response.data;
  }

  async getIssues(projectId: number | string, options: {
    state?: string;
    labels?: string[];
    milestone?: string;
    scope?: string;
    author_id?: number;
    assignee_id?: number;
    my_reaction_emoji?: string;
    weight?: number;
    order_by?: string;
    sort?: string;
    search?: string;
    per_page?: number;
  } = {}): Promise<GitLabIssue[]> {
    const resolvedId = await this.resolveProjectId(projectId);
    const params = {
      per_page: options.per_page || 20,
      state: options.state || 'opened',
      labels: options.labels?.join(','),
      milestone: options.milestone,
      scope: options.scope,
      author_id: options.author_id,
      assignee_id: options.assignee_id,
      my_reaction_emoji: options.my_reaction_emoji,
      weight: options.weight,
      order_by: options.order_by || 'created_at',
      sort: options.sort || 'desc',
      search: options.search,
    };

    const response = await this.client.get(`/projects/${resolvedId}/issues`, { params });
    return response.data;
  }

  async getIssue(projectId: number | string, issueIid: number): Promise<GitLabIssue> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}/issues/${issueIid}`);
    return response.data;
  }

  async createIssue(projectId: number | string, issueData: CreateIssueRequest): Promise<GitLabIssue> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.post(`/projects/${resolvedId}/issues`, issueData);
    return response.data;
  }

  async updateIssue(projectId: number | string, issueIid: number, issueData: Partial<CreateIssueRequest>): Promise<GitLabIssue> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.put(`/projects/${resolvedId}/issues/${issueIid}`, issueData);
    return response.data;
  }

  async getMergeRequests(projectId: number | string, options: {
    state?: string;
    order_by?: string;
    sort?: string;
    milestone?: string;
    view?: string;
    labels?: string[];
    with_labels_details?: boolean;
    with_merge_status_recheck?: boolean;
    created_after?: string;
    created_before?: string;
    updated_after?: string;
    updated_before?: string;
    scope?: string;
    author_id?: number;
    assignee_id?: number;
    approver_ids?: number[];
    approved_by_ids?: number[];
    reviewer_id?: number;
    reviewer_username?: string;
    my_reaction_emoji?: string;
    source_branch?: string;
    target_branch?: string;
    search?: string;
    per_page?: number;
  } = {}): Promise<GitLabMergeRequest[]> {
    const params = {
      per_page: options.per_page || 20,
      state: options.state || 'opened',
      order_by: options.order_by || 'created_at',
      sort: options.sort || 'desc',
      milestone: options.milestone,
      view: options.view,
      labels: options.labels?.join(','),
      with_labels_details: options.with_labels_details,
      with_merge_status_recheck: options.with_merge_status_recheck,
      created_after: options.created_after,
      created_before: options.created_before,
      updated_after: options.updated_after,
      updated_before: options.updated_before,
      scope: options.scope,
      author_id: options.author_id,
      assignee_id: options.assignee_id,
      approver_ids: options.approver_ids?.join(','),
      approved_by_ids: options.approved_by_ids?.join(','),
      reviewer_id: options.reviewer_id,
      reviewer_username: options.reviewer_username,
      my_reaction_emoji: options.my_reaction_emoji,
      source_branch: options.source_branch,
      target_branch: options.target_branch,
      search: options.search,
    };

    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}/merge_requests`, { params });
    return response.data;
  }

  async getMergeRequest(projectId: number | string, mergeRequestIid: number): Promise<GitLabMergeRequest> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}/merge_requests/${mergeRequestIid}`);
    return response.data;
  }

  async createMergeRequest(projectId: number | string, mergeRequestData: CreateMergeRequestRequest): Promise<GitLabMergeRequest> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.post(`/projects/${resolvedId}/merge_requests`, mergeRequestData);
    return response.data;
  }

  async updateMergeRequest(projectId: number | string, mergeRequestIid: number, mergeRequestData: Partial<CreateMergeRequestRequest>): Promise<GitLabMergeRequest> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.put(`/projects/${resolvedId}/merge_requests/${mergeRequestIid}`, mergeRequestData);
    return response.data;
  }

  async acceptMergeRequest(projectId: number | string, mergeRequestIid: number, options: {
    merge_commit_message?: string;
    squash_commit_message?: string;
    squash?: boolean;
    should_remove_source_branch?: boolean;
    merge_when_pipeline_succeeds?: boolean;
    sha?: string;
  } = {}): Promise<GitLabMergeRequest> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.put(`/projects/${resolvedId}/merge_requests/${mergeRequestIid}/merge`, options);
    return response.data;
  }

  async getMergeRequestChanges(projectId: number | string, mergeRequestIid: number): Promise<any> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}/merge_requests/${mergeRequestIid}/changes`);
    return response.data;
  }

  async getMergeRequestDiffs(projectId: number | string, mergeRequestIid: number): Promise<any[]> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}/merge_requests/${mergeRequestIid}/diffs`);
    return response.data;
  }

  async getUser(): Promise<any> {
    const response = await this.client.get('/user');
    return response.data;
  }

  async getProjectMembers(projectId: number | string): Promise<any[]> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}/members`);
    return response.data;
  }

  getProjectUrl(project: GitLabProject): string {
    return project.web_url;
  }

  getCommitUrl(project: GitLabProject, commit: GitLabCommit): string {
    return `${project.web_url}/-/commit/${commit.id}`;
  }

  getPipelineUrl(project: GitLabProject, pipeline: GitLabPipeline): string {
    return `${project.web_url}/-/pipelines/${pipeline.id}`;
  }

  getIssueUrl(project: GitLabProject, issue: GitLabIssue): string {
    return `${project.web_url}/-/issues/${issue.iid}`;
  }

  getMergeRequestUrl(project: GitLabProject, mergeRequest: GitLabMergeRequest): string {
    return `${project.web_url}/-/merge_requests/${mergeRequest.iid}`;
  }

  // 檔案和程式碼相關方法
  async getRepositoryTree(projectId: number | string, options: {
    path?: string;
    ref?: string;
    recursive?: boolean;
    per_page?: number;
  } = {}): Promise<any[]> {
    const resolvedId = await this.resolveProjectId(projectId);
    const params = {
      path: options.path || '',
      ref: options.ref || 'main',
      recursive: options.recursive || false,
      per_page: options.per_page || 100,
    };

    const response = await this.client.get(`/projects/${resolvedId}/repository/tree`, { params });
    return response.data;
  }

  async getRepositoryFile(projectId: number | string, filePath: string, options: {
    ref?: string;
    raw?: boolean;
  } = {}): Promise<any> {
    const resolvedId = await this.resolveProjectId(projectId);
    const encodedFilePath = encodeURIComponent(filePath);
    const endpoint = options.raw ? 'raw' : '';
    const params = {
      ref: options.ref || 'main',
    };

    const url = endpoint 
      ? `/projects/${resolvedId}/repository/files/${encodedFilePath}/${endpoint}`
      : `/projects/${resolvedId}/repository/files/${encodedFilePath}`;

    const response = await this.client.get(url, { params });
    
    // 如果是 raw 模式，直接返回文字內容
    if (options.raw) {
      return response.data;
    }
    
    // 否則返回包含 base64 內容的完整資料
    const fileData = response.data;
    if (fileData.content && fileData.encoding === 'base64') {
      fileData.decodedContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    }
    return fileData;
  }

  async searchRepositoryFiles(projectId: number | string, query: string, options: {
    ref?: string;
    per_page?: number;
  } = {}): Promise<any[]> {
    const resolvedId = await this.resolveProjectId(projectId);
    const params = {
      search: query,
      ref: options.ref || 'main',
      per_page: options.per_page || 50,
    };

    // GitLab 沒有直接的檔案搜尋 API，我們用樹狀結構遞迴搜尋
    const tree = await this.getRepositoryTree(resolvedId, { 
      recursive: true, 
      ref: options.ref,
      per_page: 1000 
    });
    
    // 過濾符合查詢條件的檔案
    const results = tree.filter(item => 
      item.type === 'blob' && 
      (item.name.toLowerCase().includes(query.toLowerCase()) || 
       item.path.toLowerCase().includes(query.toLowerCase()))
    );

    return results.slice(0, options.per_page || 50);
  }

  async getFileBlame(projectId: number | string, filePath: string, options: {
    ref?: string;
  } = {}): Promise<any[]> {
    const resolvedId = await this.resolveProjectId(projectId);
    const encodedFilePath = encodeURIComponent(filePath);
    const params = {
      ref: options.ref || 'main',
    };

    const response = await this.client.get(`/projects/${resolvedId}/repository/files/${encodedFilePath}/blame`, { params });
    return response.data;
  }

  async getFileHistory(projectId: number | string, filePath: string, options: {
    ref?: string;
    per_page?: number;
  } = {}): Promise<GitLabCommit[]> {
    const resolvedId = await this.resolveProjectId(projectId);
    const params = {
      path: filePath,
      ref: options.ref || 'main',
      per_page: options.per_page || 20,
    };

    const response = await this.client.get(`/projects/${resolvedId}/repository/commits`, { params });
    return response.data;
  }

  getFileUrl(project: GitLabProject, filePath: string, ref: string = 'main'): string {
    return `${project.web_url}/-/blob/${ref}/${filePath}`;
  }

  // Merge Request 評論相關方法
  async getMergeRequestNotes(projectId: number | string, mergeRequestIid: number, options: {
    sort?: 'asc' | 'desc';
    order_by?: 'created_at' | 'updated_at';
    per_page?: number;
  } = {}): Promise<GitLabNote[]> {
    const resolvedId = await this.resolveProjectId(projectId);
    const params = {
      sort: options.sort || 'asc',
      order_by: options.order_by || 'created_at',
      per_page: options.per_page || 100,
    };

    const response = await this.client.get(`/projects/${resolvedId}/merge_requests/${mergeRequestIid}/notes`, { params });
    return response.data;
  }

  async getMergeRequestNote(projectId: number | string, mergeRequestIid: number, noteId: number): Promise<GitLabNote> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.get(`/projects/${resolvedId}/merge_requests/${mergeRequestIid}/notes/${noteId}`);
    return response.data;
  }

  async createMergeRequestNote(projectId: number | string, mergeRequestIid: number, noteData: CreateNoteRequest): Promise<GitLabNote> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.post(`/projects/${resolvedId}/merge_requests/${mergeRequestIid}/notes`, noteData);
    return response.data;
  }

  async updateMergeRequestNote(projectId: number | string, mergeRequestIid: number, noteId: number, noteData: Partial<CreateNoteRequest>): Promise<GitLabNote> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.put(`/projects/${resolvedId}/merge_requests/${mergeRequestIid}/notes/${noteId}`, noteData);
    return response.data;
  }

  async deleteMergeRequestNote(projectId: number | string, mergeRequestIid: number, noteId: number): Promise<void> {
    const resolvedId = await this.resolveProjectId(projectId);
    await this.client.delete(`/projects/${resolvedId}/merge_requests/${mergeRequestIid}/notes/${noteId}`);
  }

  // Issue 評論相關方法（作為額外功能）
  async getIssueNotes(projectId: number | string, issueIid: number, options: {
    sort?: 'asc' | 'desc';
    order_by?: 'created_at' | 'updated_at';
    per_page?: number;
  } = {}): Promise<GitLabNote[]> {
    const resolvedId = await this.resolveProjectId(projectId);
    const params = {
      sort: options.sort || 'asc',
      order_by: options.order_by || 'created_at',
      per_page: options.per_page || 100,
    };

    const response = await this.client.get(`/projects/${resolvedId}/issues/${issueIid}/notes`, { params });
    return response.data;
  }

  async createIssueNote(projectId: number | string, issueIid: number, noteData: CreateNoteRequest): Promise<GitLabNote> {
    const resolvedId = await this.resolveProjectId(projectId);
    const response = await this.client.post(`/projects/${resolvedId}/issues/${issueIid}/notes`, noteData);
    return response.data;
  }

  getNoteUrl(project: GitLabProject, mergeRequest: GitLabMergeRequest, noteId: number): string {
    return `${project.web_url}/-/merge_requests/${mergeRequest.iid}#note_${noteId}`;
  }
}