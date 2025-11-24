import { useEffect, useRef } from 'react';

import { mcpService } from '@/services/mcp';
import { pluginService } from '@/services/plugin';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { useToolStore } from '@/store/tool';
import { pluginSelectors } from '@/store/tool/selectors';
import { SEND_REPORT_MCP_IDENTIFIER, SendReportMCPTool } from '@/tools/send-report-mcp';

export const useInitializeSendReportMCP = () => {
  const installed = useRef(false);
  const installedPlugin = useToolStore((s) =>
    pluginSelectors.getInstalledPluginById(SEND_REPORT_MCP_IDENTIFIER)(s),
  );
  const currentPlugins = useAgentStore((s) => agentSelectors.currentAgentPlugins(s));

  // Get current session meta to check if it's QA Agent
  const currentSession = useSessionStore((s) => sessionSelectors.currentSession(s));
  const isQAAgent = currentSession?.meta?.title === 'QA Agent';

  // Install the plugin once
  useEffect(() => {
    const installSendReportMCP = async () => {
      // Skip installation for QA Agent
      if (isQAAgent) {
        console.log('[useInitializeSendReportMCP] Skipping installation for QA Agent');
        return;
      }

      // Only install once
      if (installed.current) return;

      // Check if the MCP plugin exists and has API manifest
      if (
        installedPlugin &&
        installedPlugin.manifest?.api &&
        installedPlugin.manifest.api.length > 0
      ) {
        installed.current = true;
        console.log('[useInitializeSendReportMCP] Send Report MCP plugin already installed');
        return;
      }

      try {
        installed.current = true;

        console.log('[useInitializeSendReportMCP] Installing Send Report MCP plugin...');

        // Fetch the actual manifest from the MCP server
        const manifest = await mcpService.getStreamableMcpServerManifest({
          identifier: SEND_REPORT_MCP_IDENTIFIER,
          metadata: {
            avatar: SendReportMCPTool.manifest?.meta.avatar,
            description: SendReportMCPTool.manifest?.meta.description,
            name: SendReportMCPTool.manifest?.meta.title,
          },
          url: 'http://104.43.56.99:8002/mcp',
        });

        // Save the plugin with the fetched manifest
        await pluginService.installPlugin({
          customParams: (SendReportMCPTool.customParams || {}) as Record<string, any>,
          identifier: SEND_REPORT_MCP_IDENTIFIER,
          manifest,
          type: 'plugin',
        });

        // Refresh plugins list
        await useToolStore.getState().refreshPlugins();

        console.log('[useInitializeSendReportMCP] Send Report MCP server installed successfully');

        // Enable the plugin immediately after installation
        await useAgentStore.getState().togglePlugin(SEND_REPORT_MCP_IDENTIFIER, true);
        console.log('[useInitializeSendReportMCP] Send Report MCP plugin enabled');
      } catch (error) {
        console.error('[useInitializeSendReportMCP] Failed to install Send Report MCP:', error);
        installed.current = false; // Reset so we can retry
        // Don't throw - we don't want to break the app if MCP server is unavailable
      }
    };

    installSendReportMCP();
  }, [installedPlugin, isQAAgent]);

  // Ensure the plugin is always enabled (runs every time currentPlugins changes)
  useEffect(() => {
    const ensureEnabled = async () => {
      // Skip enabling for QA Agent
      if (isQAAgent) {
        console.log('[useInitializeSendReportMCP] Skipping enable for QA Agent');
        // If it's enabled, disable it
        if (currentPlugins.includes(SEND_REPORT_MCP_IDENTIFIER)) {
          console.log('[useInitializeSendReportMCP] Disabling Send Report MCP plugin for QA Agent');
          await useAgentStore.getState().togglePlugin(SEND_REPORT_MCP_IDENTIFIER, false);
        }
        return;
      }

      // Only enable if plugin is installed
      if (!installedPlugin) {
        console.log('[useInitializeSendReportMCP] Plugin not installed yet, skipping enable check');
        return;
      }

      // Check if plugin has manifest API
      if (!installedPlugin.manifest?.api || installedPlugin.manifest.api.length === 0) {
        console.log(
          '[useInitializeSendReportMCP] Plugin has no API manifest, skipping enable check',
        );
        return;
      }

      // If not enabled, enable it
      if (!currentPlugins.includes(SEND_REPORT_MCP_IDENTIFIER)) {
        console.log(
          '[useInitializeSendReportMCP] Enabling Send Report MCP plugin (not in current plugins)',
        );
        await useAgentStore.getState().togglePlugin(SEND_REPORT_MCP_IDENTIFIER, true);
      } else {
        console.log('[useInitializeSendReportMCP] Send Report MCP plugin is already enabled');
      }
    };

    ensureEnabled();
  }, [installedPlugin, currentPlugins, isQAAgent]);
};
