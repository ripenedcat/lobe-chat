import { useEffect, useRef } from 'react';

import { mcpService } from '@/services/mcp';
import { pluginService } from '@/services/plugin';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { useToolStore } from '@/store/tool';
import { pluginSelectors } from '@/store/tool/selectors';
import { MILVUS_MCP_IDENTIFIER, MilvusMCPTool } from '@/tools/milvus-mcp';

export const useInitializeMilvusMCP = () => {
  const installed = useRef(false);
  const installedPlugin = useToolStore((s) =>
    pluginSelectors.getInstalledPluginById(MILVUS_MCP_IDENTIFIER)(s),
  );
  const currentPlugins = useAgentStore((s) => agentSelectors.currentAgentPlugins(s));

  // Install the plugin once
  useEffect(() => {
    const installMilvusMCP = async () => {
      // Only install once
      if (installed.current) return;

      // Check if the MCP plugin exists and has API manifest
      if (
        installedPlugin &&
        installedPlugin.manifest?.api &&
        installedPlugin.manifest.api.length > 0
      ) {
        installed.current = true;
        console.log('[useInitializeMilvusMCP] Milvus MCP plugin already installed');
        return;
      }

      try {
        installed.current = true;

        console.log('[useInitializeMilvusMCP] Installing Milvus MCP plugin...');

        // Fetch the actual manifest from the MCP server
        const manifest = await mcpService.getStreamableMcpServerManifest({
          identifier: MILVUS_MCP_IDENTIFIER,
          metadata: {
            avatar: MilvusMCPTool.manifest?.meta.avatar,
            description: MilvusMCPTool.manifest?.meta.description,
          },
          url: 'http://104.43.56.99:8001/mcp',
        });

        // Save the plugin with the fetched manifest
        await pluginService.installPlugin({
          customParams: (MilvusMCPTool.customParams || {}) as Record<string, any>,
          identifier: MILVUS_MCP_IDENTIFIER,
          manifest,
          type: 'plugin',
        });

        // Refresh plugins list
        await useToolStore.getState().refreshPlugins();

        console.log('[useInitializeMilvusMCP] Milvus MCP server installed successfully');

        // Enable the plugin immediately after installation
        await useAgentStore.getState().togglePlugin(MILVUS_MCP_IDENTIFIER, true);
        console.log('[useInitializeMilvusMCP] Milvus MCP plugin enabled');
      } catch (error) {
        console.error('[useInitializeMilvusMCP] Failed to install Milvus MCP:', error);
        installed.current = false; // Reset so we can retry
        // Don't throw - we don't want to break the app if MCP server is unavailable
      }
    };

    installMilvusMCP();
  }, [installedPlugin]);

  // Ensure the plugin is always enabled (runs every time currentPlugins changes)
  useEffect(() => {
    const ensureEnabled = async () => {
      // Only enable if plugin is installed
      if (!installedPlugin) {
        console.log('[useInitializeMilvusMCP] Plugin not installed yet, skipping enable check');
        return;
      }

      // Check if plugin has manifest API
      if (!installedPlugin.manifest?.api || installedPlugin.manifest.api.length === 0) {
        console.log('[useInitializeMilvusMCP] Plugin has no API manifest, skipping enable check');
        return;
      }

      // If not enabled, enable it
      if (!currentPlugins.includes(MILVUS_MCP_IDENTIFIER)) {
        console.log('[useInitializeMilvusMCP] Enabling Milvus MCP plugin (not in current plugins)');
        await useAgentStore.getState().togglePlugin(MILVUS_MCP_IDENTIFIER, true);
      } else {
        console.log('[useInitializeMilvusMCP] Milvus MCP plugin is already enabled');
      }
    };

    ensureEnabled();
  }, [installedPlugin, currentPlugins]);
};
