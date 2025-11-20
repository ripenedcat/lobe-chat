import { ModelProviderCard } from '@/types/llm';

const GithubCopilot: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 200_000,
      description:
        'GPT-5 is an advanced language model with exceptional reasoning and understanding capabilities.',
      displayName: 'gpt-5',
      enabled: true,
      functionCall: true,
      id: 'gpt-5',
      maxOutput: 32_000,
    },
    {
      contextWindowTokens: 200_000,
      description:
        'Claude Sonnet 4.5 provides excellent performance with advanced reasoning capabilities.',
      displayName: 'claude-sonnet-4.5',
      enabled: true,
      functionCall: true,
      id: 'claude-sonnet-4.5',
      maxOutput: 64_000,
    },
  ],
  checkModel: 'gpt-5',
  description:
    'GitHub Copilot provides access to advanced AI models for enterprise development workflows.',
  enabled: true,
  id: 'githubcopilot',
  name: 'GitHub Copilot',
  settings: {
    sdkType: 'anthropic',
    showApiKey: false, // Hide API Key since it's configured via backend environment variables
    showModelFetcher: false, // Disable adding custom models
  },
  url: 'https://github.com/features/copilot',
};

export default GithubCopilot;
