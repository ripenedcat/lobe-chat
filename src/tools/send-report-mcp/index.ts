import { LobeTool } from '@lobechat/types';

export const SEND_REPORT_MCP_IDENTIFIER = 'send-report-mcp-http';

export const SendReportMCPTool: LobeTool = {
  customParams: {
    mcp: {
      type: 'http',
      url: 'http://104.43.56.99:8002/mcp',
    },
  },
  identifier: SEND_REPORT_MCP_IDENTIFIER,
  manifest: {
    api: [],
    author: 'LobeHub',
    createdAt: new Date('2024-01-01').toISOString(),
    homepage: 'https://lobehub.com',
    identifier: SEND_REPORT_MCP_IDENTIFIER,
    meta: {
      avatar: '📊',
      description: 'Send and manage reports via Send Report service',
      tags: ['report', 'send', 'service'],
      title: 'Send Report',
    },
    systemRole: '',
    type: 'default',
    version: '1',
  },
  runtimeType: 'mcp',
  source: 'builtin',
  type: 'plugin',
};
