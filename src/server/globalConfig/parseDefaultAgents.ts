import { LLMParams } from 'model-bank';

export interface DefaultAgentEnvConfig {
  /**
   * Model parameters configuration
   */
  params?: Partial<LLMParams>;
  /**
   * System role for the agent
   */
  systemRole?: string;
}

export interface DefaultAgentsConfig {
  checkpointAgent?: DefaultAgentEnvConfig;
  qaAgent?: DefaultAgentEnvConfig;
  readinessPlanAgent?: DefaultAgentEnvConfig;
}

// Helper to parse agent config from env vars with a specific prefix
const parseAgentConfig = (prefix: string): DefaultAgentEnvConfig | undefined => {
  const systemRole = process.env[`${prefix}_SYSTEM_ROLE`];
  const frequencyPenalty = process.env[`${prefix}_FREQUENCY_PENALTY`];
  const presencePenalty = process.env[`${prefix}_PRESENCE_PENALTY`];
  const temperature = process.env[`${prefix}_TEMPERATURE`];
  const topP = process.env[`${prefix}_TOP_P`];

  // If no env vars are set for this agent, return undefined
  if (!systemRole && !frequencyPenalty && !presencePenalty && !temperature && !topP) {
    return undefined;
  }

  const agentConfig: DefaultAgentEnvConfig = {};

  if (systemRole) {
    agentConfig.systemRole = systemRole;
  }

  // Parse model parameters if any are provided
  const params: Partial<LLMParams> = {};
  let hasParams = false;

  if (frequencyPenalty !== undefined) {
    const value = Number.parseFloat(frequencyPenalty);
    if (!Number.isNaN(value) && value >= 0 && value <= 2) {
      params.frequency_penalty = value;
      hasParams = true;
    }
  }

  if (presencePenalty !== undefined) {
    const value = Number.parseFloat(presencePenalty);
    if (!Number.isNaN(value) && value >= 0 && value <= 2) {
      params.presence_penalty = value;
      hasParams = true;
    }
  }

  if (temperature !== undefined) {
    const value = Number.parseFloat(temperature);
    if (!Number.isNaN(value) && value >= 0 && value <= 2) {
      params.temperature = value;
      hasParams = true;
    }
  }

  if (topP !== undefined) {
    const value = Number.parseFloat(topP);
    if (!Number.isNaN(value) && value >= 0 && value <= 1) {
      params.top_p = value;
      hasParams = true;
    }
  }

  if (hasParams) {
    agentConfig.params = params;
  }

  return agentConfig;
};

/**
 * Parse default agents configuration from environment variables
 *
 * Environment variable format:
 * - READINESS_PLAN_AGENT_SYSTEM_ROLE: System role for Readiness Plan Agent
 * - READINESS_PLAN_AGENT_FREQUENCY_PENALTY: Frequency penalty (0-2)
 * - READINESS_PLAN_AGENT_PRESENCE_PENALTY: Presence penalty (0-2)
 * - READINESS_PLAN_AGENT_TEMPERATURE: Temperature (0-2)
 * - READINESS_PLAN_AGENT_TOP_P: Top P (0-1)
 *
 * (Same pattern for CHECKPOINT_AGENT_* and QA_AGENT_*)
 */
export const parseDefaultAgents = (): DefaultAgentsConfig => {
  const config: DefaultAgentsConfig = {};

  // Parse each agent's configuration
  config.readinessPlanAgent = parseAgentConfig('READINESS_PLAN_AGENT');
  config.checkpointAgent = parseAgentConfig('CHECKPOINT_AGENT');
  config.qaAgent = parseAgentConfig('QA_AGENT');

  return config;
};
