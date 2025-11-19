import { LobeTool } from '@lobechat/types';

export const MILVUS_MCP_IDENTIFIER = 'milvus-mcp-http';

export const MilvusMCPTool: LobeTool = {
  customParams: {
    mcp: {
      type: 'http',
      url: 'http://104.43.56.99:8001/mcp',
    },
  },
  identifier: MILVUS_MCP_IDENTIFIER,
  manifest: {
    api: [],
    author: 'LobeHub',
    createdAt: new Date('2024-01-01').toISOString(),
    homepage: 'https://lobehub.com',
    identifier: MILVUS_MCP_IDENTIFIER,
    meta: {
      avatar: '📦',
      description: 'Built-in Milvus MCP Server for knowledge base search',
      tags: ['mcp', 'builtin', 'knowledge-base'],
      title: 'Milvus Knowledge Base',
    },
    systemRole: '',
    type: 'default',
    version: '1',
  },
  runtimeType: 'mcp',
  source: 'builtin',
  type: 'plugin', // Changed from 'builtin' to 'plugin' so it appears in Plugins section
};
