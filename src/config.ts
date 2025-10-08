interface Config {
  githubBaseUrl: string;
  githubAccessToken: string;
  sentryUrl?: string;
  sentryOrgSlug?: string;
  sentryProject?: string;
  sentryAuthToken?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

function validateConfig(): Config {
  const requiredVars = {
    githubBaseUrl: process.env.GITHUB_BASE_URL || 'https://api.github.com',
    githubAccessToken: process.env.GITHUB_ACCESS_TOKEN,
  };

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
    }
  }

  return {
    githubBaseUrl: requiredVars.githubBaseUrl!,
    githubAccessToken: requiredVars.githubAccessToken!,
    sentryUrl: process.env.SENTRY_URL,
    sentryOrgSlug: process.env.SENTRY_ORG_SLUG,
    sentryProject: process.env.SENTRY_PROJECT,
    sentryAuthToken: process.env.SENTRY_AUTH_TOKEN,
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  };
}

export const config = validateConfig();
