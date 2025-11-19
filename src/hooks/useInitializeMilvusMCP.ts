import { useEffect, useRef } from 'react';

import { mcpService } from '@/services/mcp';
import { pluginService } from '@/services/plugin';
import { useToolStore } from '@/store/tool';
import { pluginSelectors } from '@/store/tool/selectors';
import { MILVUS_MCP_IDENTIFIER, MilvusMCPTool } from '@/tools/milvus-mcp';

export const useInitializeMilvusMCP = () => {
  const initialized = useRef(false);
  const installedPlugin = useToolStore((s) =>
    pluginSelectors.getInstalledPluginById(MILVUS_MCP_IDENTIFIER)(s),
  );

  useEffect(() => {
    const initializeMilvusMCP = async () => {
      // Only initialize once
      if (initialized.current) return;

      // Check if the MCP plugin exists and has API manifest
      if (
        installedPlugin &&
        installedPlugin.manifest?.api &&
        installedPlugin.manifest.api.length > 0
      ) {
        initialized.current = true;
        return;
      }

      try {
        initialized.current = true;

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

        console.log('[useInitializeMilvusMCP] Milvus MCP server initialized successfully');
      } catch (error) {
        console.error('[useInitializeMilvusMCP] Failed to initialize Milvus MCP:', error);
        // Don't throw - we don't want to break the app if MCP server is unavailable
      }
    };

    initializeMilvusMCP();
  }, [installedPlugin]);
};
