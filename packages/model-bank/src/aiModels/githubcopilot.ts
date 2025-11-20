import { AIChatModelCard } from '../types/aiModel';

const githubCopilotChatModels: AIChatModelCard[] = [
  {
    abilities: {
      functionCall: true,
      reasoning: true,
      vision: true,
    },
    contextWindowTokens: 400_000,
    description:
      'GPT-5 is an advanced language model with exceptional reasoning and understanding capabilities.',
    displayName: 'gpt-5',
    enabled: true,
    id: 'gpt-5',
    maxOutput: 32_000,
    type: 'chat',
  },
];

export const allModels = [...githubCopilotChatModels];

export default allModels;
