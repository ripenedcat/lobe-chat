import { AIChatModelCard } from '../types/aiModel';

const githubCopilotChatModels: AIChatModelCard[] = [
  {
    abilities: {
      functionCall: true,
    },
    contextWindowTokens: 200_000,
    description:
      'GPT-5 is an advanced language model with exceptional reasoning and understanding capabilities.',
    displayName: 'gpt-5',
    enabled: true,
    id: 'gpt-5',
    maxOutput: 32_000,
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
    },
    contextWindowTokens: 200_000,
    description:
      'Claude Sonnet 4.5 provides excellent performance with advanced reasoning capabilities.',
    displayName: 'claude-sonnet-4.5',
    enabled: true,
    id: 'claude-sonnet-4.5',
    maxOutput: 64_000,
    type: 'chat',
  },
];

export const allModels = [...githubCopilotChatModels];

export default allModels;
