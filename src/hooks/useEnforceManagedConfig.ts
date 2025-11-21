import { useEffect, useRef } from 'react';
import { mutate } from 'swr';

import { agentService } from '@/services/agent';
import { sessionService } from '@/services/session';
import { useAgentStore } from '@/store/agent';

const FETCH_AGENT_CONFIG_KEY = 'fetchAgentConfig';

/**
 * Hook to enforce managed configuration for default agents from environment variables.
 * This hook will:
 * 1. Wait for agent configs to be initialized
 * 2. Update existing default agents' configurations when the app initializes
 * 3. Refresh the client-side cache to reflect the updates
 * 4. Only run once on mount to avoid unnecessary API calls
 *
 * The configuration is managed via environment variables:
 * - READINESS_PLAN_AGENT_SYSTEM_ROLE
 * - READINESS_PLAN_AGENT_FREQUENCY_PENALTY
 * - READINESS_PLAN_AGENT_PRESENCE_PENALTY
 * - READINESS_PLAN_AGENT_TEMPERATURE
 * - READINESS_PLAN_AGENT_TOP_P
 *
 * (Same pattern for CHECKPOINT_AGENT_* and QA_AGENT_*)
 *
 * @param isLogin - Whether the user is logged in
 */
export const useEnforceManagedConfig = (isLogin: boolean) => {
  const hasRun = useRef(false);
  const isInboxAgentConfigInit = useAgentStore((s) => s.isInboxAgentConfigInit);

  useEffect(() => {
    // Only run once, only if user is logged in, and after inbox agent is initialized
    if (!isLogin || hasRun.current || !isInboxAgentConfigInit) {
      return;
    }

    const enforceConfig = async () => {
      try {
        console.log('[useEnforceManagedConfig] Enforcing managed config for default agents');

        // Update the configurations on the server
        await agentService.updateDefaultAssistantsConfig();

        console.log('[useEnforceManagedConfig] Successfully enforced managed config');

        // Refresh the agent configs in client cache
        const agentSlugs = ['readiness-plan-agent', 'checkpoint-agent', 'qa-agent'];

        for (const slug of agentSlugs) {
          try {
            // Fetch the sessions to get the ID
            const sessions = await sessionService.getSessionsByType('agent');
            const session = sessions.find((s: any) => s.slug === slug);

            if (session?.id) {
              console.log(`[useEnforceManagedConfig] Refreshing cache for ${slug} (${session.id})`);
              // Invalidate the SWR cache for this agent
              await mutate([FETCH_AGENT_CONFIG_KEY, session.id]);
            }
          } catch (error) {
            console.error(`[useEnforceManagedConfig] Failed to refresh cache for ${slug}:`, error);
          }
        }

        console.log('[useEnforceManagedConfig] Finished refreshing agent caches');
      } catch (error) {
        console.error('[useEnforceManagedConfig] Failed to enforce managed config:', error);
      }
    };

    enforceConfig();
    hasRun.current = true;
  }, [isLogin, isInboxAgentConfigInit]);
};
