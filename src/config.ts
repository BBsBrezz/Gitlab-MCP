interface Config {
  githubBaseUrl: string;
  githubAccessToken: string;
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
  };
}

export const config = validateConfig();
