import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import PluginTag from '@/components/Plugins/PluginTag';
import { useToolStore } from '@/store/tool';
import { customPluginSelectors } from '@/store/tool/selectors';
import { MILVUS_MCP_IDENTIFIER } from '@/tools/milvus-mcp';
import { SEND_REPORT_MCP_IDENTIFIER } from '@/tools/send-report-mcp';

import CheckboxItem, { CheckboxItemProps } from '../components/CheckbokWithLoading';

const ToolItem = memo<CheckboxItemProps>(({ id, onUpdate, label, checked }) => {
  const isCustom = useToolStore((s) => customPluginSelectors.isCustomPlugin(id)(s));
  // Disable checkbox for built-in MCP servers
  const isBuiltinMCP = id === MILVUS_MCP_IDENTIFIER || id === SEND_REPORT_MCP_IDENTIFIER;

  return (
    <CheckboxItem
      checked={checked}
      disabled={isBuiltinMCP}
      id={id}
      label={
        <Flexbox align={'center'} gap={8} horizontal>
          {label || id}
          {isCustom && <PluginTag showText={false} type={'customPlugin'} />}
        </Flexbox>
      }
      onUpdate={onUpdate}
    />
  );
});

export default ToolItem;
