import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { parseDefaultAgents } from './parseDefaultAgents';

describe('parseDefaultAgents', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return empty config when no env vars are set', () => {
    const config = parseDefaultAgents();
    expect(config).toEqual({});
  });

  it('should parse readiness plan agent system role', () => {
    process.env.READINESS_PLAN_AGENT_SYSTEM_ROLE = 'You are a Readiness Plan Agent from env';

    const config = parseDefaultAgents();

    expect(config.readinessPlanAgent).toEqual({
      systemRole: 'You are a Readiness Plan Agent from env',
    });
  });

  it('should parse readiness plan agent model parameters', () => {
    process.env.READINESS_PLAN_AGENT_FREQUENCY_PENALTY = '0.5';
    process.env.READINESS_PLAN_AGENT_PRESENCE_PENALTY = '0.3';
    process.env.READINESS_PLAN_AGENT_TEMPERATURE = '0.7';
    process.env.READINESS_PLAN_AGENT_TOP_P = '0.9';

    const config = parseDefaultAgents();

    expect(config.readinessPlanAgent).toEqual({
      params: {
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
        temperature: 0.7,
        top_p: 0.9,
      },
    });
  });

  it('should parse complete readiness plan agent config', () => {
    process.env.READINESS_PLAN_AGENT_SYSTEM_ROLE = 'You are a Readiness Plan Agent';
    process.env.READINESS_PLAN_AGENT_FREQUENCY_PENALTY = '0.5';
    process.env.READINESS_PLAN_AGENT_PRESENCE_PENALTY = '0.3';
    process.env.READINESS_PLAN_AGENT_TEMPERATURE = '0.7';
    process.env.READINESS_PLAN_AGENT_TOP_P = '0.9';

    const config = parseDefaultAgents();

    expect(config.readinessPlanAgent).toEqual({
      params: {
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
        temperature: 0.7,
        top_p: 0.9,
      },
      systemRole: 'You are a Readiness Plan Agent',
    });
  });

  it('should parse checkpoint agent config', () => {
    process.env.CHECKPOINT_AGENT_SYSTEM_ROLE = 'You are a Checkpoint Agent';
    process.env.CHECKPOINT_AGENT_TEMPERATURE = '0.8';

    const config = parseDefaultAgents();

    expect(config.checkpointAgent).toEqual({
      params: {
        temperature: 0.8,
      },
      systemRole: 'You are a Checkpoint Agent',
    });
  });

  it('should parse QA agent config', () => {
    process.env.QA_AGENT_SYSTEM_ROLE = 'You are a QA Agent';
    process.env.QA_AGENT_TOP_P = '0.95';

    const config = parseDefaultAgents();

    expect(config.qaAgent).toEqual({
      params: {
        top_p: 0.95,
      },
      systemRole: 'You are a QA Agent',
    });
  });

  it('should parse all three agents independently', () => {
    process.env.READINESS_PLAN_AGENT_SYSTEM_ROLE = 'Readiness Plan Agent';
    process.env.READINESS_PLAN_AGENT_TEMPERATURE = '0.7';

    process.env.CHECKPOINT_AGENT_SYSTEM_ROLE = 'Checkpoint Agent';
    process.env.CHECKPOINT_AGENT_TEMPERATURE = '0.8';

    process.env.QA_AGENT_SYSTEM_ROLE = 'QA Agent';
    process.env.QA_AGENT_TEMPERATURE = '0.9';

    const config = parseDefaultAgents();

    expect(config.readinessPlanAgent).toEqual({
      params: { temperature: 0.7 },
      systemRole: 'Readiness Plan Agent',
    });

    expect(config.checkpointAgent).toEqual({
      params: { temperature: 0.8 },
      systemRole: 'Checkpoint Agent',
    });

    expect(config.qaAgent).toEqual({
      params: { temperature: 0.9 },
      systemRole: 'QA Agent',
    });
  });

  it('should ignore invalid frequency_penalty values', () => {
    process.env.READINESS_PLAN_AGENT_FREQUENCY_PENALTY = 'invalid';
    process.env.READINESS_PLAN_AGENT_SYSTEM_ROLE = 'Test';

    const config = parseDefaultAgents();

    expect(config.readinessPlanAgent).toEqual({
      systemRole: 'Test',
    });
  });

  it('should ignore out-of-range frequency_penalty values', () => {
    process.env.READINESS_PLAN_AGENT_FREQUENCY_PENALTY = '3.0'; // > 2
    process.env.READINESS_PLAN_AGENT_SYSTEM_ROLE = 'Test';

    const config = parseDefaultAgents();

    expect(config.readinessPlanAgent).toEqual({
      systemRole: 'Test',
    });
  });

  it('should ignore out-of-range top_p values', () => {
    process.env.READINESS_PLAN_AGENT_TOP_P = '1.5'; // > 1
    process.env.READINESS_PLAN_AGENT_SYSTEM_ROLE = 'Test';

    const config = parseDefaultAgents();

    expect(config.readinessPlanAgent).toEqual({
      systemRole: 'Test',
    });
  });

  it('should accept boundary values for parameters', () => {
    process.env.READINESS_PLAN_AGENT_FREQUENCY_PENALTY = '0';
    process.env.READINESS_PLAN_AGENT_PRESENCE_PENALTY = '2';
    process.env.READINESS_PLAN_AGENT_TEMPERATURE = '2';
    process.env.READINESS_PLAN_AGENT_TOP_P = '0';

    const config = parseDefaultAgents();

    expect(config.readinessPlanAgent).toEqual({
      params: {
        frequency_penalty: 0,
        presence_penalty: 2,
        temperature: 2,
        top_p: 0,
      },
    });
  });

  it('should handle partial parameter configuration', () => {
    process.env.READINESS_PLAN_AGENT_TEMPERATURE = '0.7';
    // Only temperature is set, others are undefined

    const config = parseDefaultAgents();

    expect(config.readinessPlanAgent).toEqual({
      params: {
        temperature: 0.7,
      },
    });
  });

  it('should return undefined for agents with no env vars', () => {
    process.env.READINESS_PLAN_AGENT_SYSTEM_ROLE = 'Only readiness plan set';

    const config = parseDefaultAgents();

    expect(config.readinessPlanAgent).toBeDefined();
    expect(config.checkpointAgent).toBeUndefined();
    expect(config.qaAgent).toBeUndefined();
  });
});
