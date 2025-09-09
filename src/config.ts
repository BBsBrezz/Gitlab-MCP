interface Config {
  gitlabBaseUrl: string;
  gitlabAccessToken: string;
  sentryUrl?: string;
  sentryOrgSlug?: string;
  sentryProject?: string;
  sentryAuthToken?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

function validateConfig(): Config {
  const requiredVars = {
    gitlabBaseUrl: process.env.GITLAB_BASE_URL,
    gitlabAccessToken: process.env.GITLAB_ACCESS_TOKEN,
  };

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
    }
  }

  return {
    gitlabBaseUrl: requiredVars.gitlabBaseUrl!,
    gitlabAccessToken: requiredVars.gitlabAccessToken!,
    sentryUrl: process.env.SENTRY_URL,
    sentryOrgSlug: process.env.SENTRY_ORG_SLUG,
    sentryProject: process.env.SENTRY_PROJECT,
    sentryAuthToken: process.env.SENTRY_AUTH_TOKEN,
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  };
}

export const config = validateConfig();