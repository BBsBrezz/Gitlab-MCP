export interface GitLabProject {
  id: number;
  name: string;
  path: string;
  path_with_namespace: string;
  description: string;
  default_branch: string;
  web_url: string;
  created_at: string;
  last_activity_at: string;
  visibility: string;
  issues_enabled: boolean;
  merge_requests_enabled: boolean;
  wiki_enabled: boolean;
  jobs_enabled: boolean;
  snippets_enabled: boolean;
  container_registry_enabled: boolean;
  service_desk_enabled: boolean;
  star_count: number;
  forks_count: number;
}

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  web_url: string;
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface GitLabPipeline {
  id: number;
  iid: number;
  project_id: number;
  status: string;
  ref: string;
  sha: string;
  before_sha: string;
  tag: boolean;
  yaml_errors: string | null;
  user?: {
    id: number;
    username: string;
    name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
  started_at: string;
  finished_at: string;
  committed_at: string;
  duration: number;
  queued_duration: number;
  coverage: string | null;
  web_url: string;
}

export interface GitLabJob {
  id: number;
  status: string;
  stage: string;
  name: string;
  ref: string;
  tag: boolean;
  coverage: string | null;
  allow_failure: boolean;
  created_at: string;
  started_at: string;
  finished_at: string;
  duration: number;
  queued_duration: number;
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
  };
  commit: {
    id: string;
    short_id: string;
    title: string;
    message: string;
    author_name: string;
    author_email: string;
    authored_date: string;
    committer_name: string;
    committer_email: string;
    committed_date: string;
  };
  pipeline: {
    id: number;
    project_id: number;
    ref: string;
    sha: string;
    status: string;
  };
  web_url: string;
}

export interface GitLabIssue {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  closed_by: any | null;
  labels: string[];
  milestone: any | null;
  assignees: any[];
  author: {
    id: number;
    username: string;
    name: string;
    email: string;
  };
  assignee: any | null;
  user_notes_count: number;
  merge_requests_count: number;
  upvotes: number;
  downvotes: number;
  due_date: string | null;
  confidential: boolean;
  discussion_locked: boolean;
  web_url: string;
  time_stats: {
    time_estimate: number;
    total_time_spent: number;
    human_time_estimate: string | null;
    human_total_time_spent: string | null;
  };
  task_completion_status: {
    count: number;
    completed_count: number;
  };
  blocking_issues_count: number;
  has_tasks: boolean;
  task_status: string;
  _links: {
    self: string;
    notes: string;
    award_emoji: string;
    project: string;
    closed_as_duplicate_of: string | null;
  };
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  merged_by: any | null;
  merged_at: string | null;
  closed_by: any | null;
  closed_at: string | null;
  target_branch: string;
  source_branch: string;
  user_notes_count: number;
  upvotes: number;
  downvotes: number;
  author: {
    id: number;
    username: string;
    name: string;
    email: string;
  };
  assignees: any[];
  assignee: any | null;
  reviewers: any[];
  source_project_id: number;
  target_project_id: number;
  labels: string[];
  draft: boolean;
  work_in_progress: boolean;
  milestone: any | null;
  merge_when_pipeline_succeeds: boolean;
  merge_status: string;
  detailed_merge_status: string;
  sha: string;
  merge_commit_sha: string | null;
  squash_commit_sha: string | null;
  discussion_locked: boolean;
  should_remove_source_branch: boolean;
  force_remove_source_branch: boolean;
  reference: string;
  references: {
    short: string;
    relative: string;
    full: string;
  };
  web_url: string;
  time_stats: {
    time_estimate: number;
    total_time_spent: number;
    human_time_estimate: string | null;
    human_total_time_spent: string | null;
  };
  squash: boolean;
  task_completion_status: {
    count: number;
    completed_count: number;
  };
  has_conflicts: boolean;
  blocking_discussions_resolved: boolean;
  approvals_before_merge: number;
}

export interface CreateIssueRequest {
  title: string;
  description?: string;
  assignee_ids?: number[];
  milestone_id?: number;
  labels?: string[];
  created_at?: string;
  due_date?: string;
  merge_request_to_resolve_discussions_of?: number;
  discussion_to_resolve?: string;
  weight?: number;
  epic_id?: number;
  epic_iid?: number;
}

export interface CreateMergeRequestRequest {
  title: string;
  source_branch: string;
  target_branch: string;
  description?: string;
  assignee_ids?: number[];
  assignee_id?: number;
  reviewer_ids?: number[];
  milestone_id?: number;
  labels?: string[];
  target_project_id?: number;
  remove_source_branch?: boolean;
  allow_collaboration?: boolean;
  allow_maintainer_to_push?: boolean;
  squash?: boolean;
}