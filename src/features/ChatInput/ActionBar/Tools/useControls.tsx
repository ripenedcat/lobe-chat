import { Icon, ItemType } from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import { ToyBrick } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import PluginAvatar from '@/components/Plugins/PluginAvatar';
import { useCheckPluginsIsInstalled } from '@/hooks/useCheckPluginsIsInstalled';
import { useFetchInstalledPlugins } from '@/hooks/useFetchInstalledPlugins';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { useToolStore } from '@/store/tool';
import { pluginSelectors } from '@/store/tool/selectors';

import ToolItem from './ToolItem';

export const useControls = (props: {
  setModalOpen: (open: boolean) => void;
  setUpdating: (updating: boolean) => void;
}) => {
  const { setUpdating } = props;
  const { t } = useTranslation('setting');
  const list = useToolStore(pluginSelectors.installedPluginMetaList, isEqual);
  const [checked, togglePlugin] = useAgentStore((s) => [
    agentSelectors.currentAgentPlugins(s),
    s.togglePlugin,
  ]);
  const enablePluginCount = useAgentStore((s) => agentSelectors.currentAgentPlugins(s).length);
  const plugins = useAgentStore((s) => agentSelectors.currentAgentPlugins(s));

  const [useFetchPluginStore] = useToolStore((s) => [s.useFetchPluginStore]);

  useFetchPluginStore();
  useFetchInstalledPlugins();
  useCheckPluginsIsInstalled(plugins);

  const items: ItemType[] = [
    {
      children: list.map((item) => ({
        icon: item?.avatar ? (
          <PluginAvatar avatar={item.avatar} size={20} />
        ) : (
          <Icon icon={ToyBrick} size={20} />
        ),
        key: item.identifier,
        label: (
          <ToolItem
            checked={checked.includes(item.identifier)}
            id={item.identifier}
            label={item.title}
            onUpdate={async () => {
              setUpdating(true);
              await togglePlugin(item.identifier);
              setUpdating(false);
            }}
          />
        ),
      })),
      key: 'plugins',
      label: (
        <Flexbox align={'center'} gap={40} horizontal justify={'space-between'}>
          {t('tools.plugins.groupName')}
          {enablePluginCount === 0 ? null : (
            <div style={{ fontSize: 12, marginInlineEnd: 4 }}>
              {t('tools.plugins.enabled', { num: enablePluginCount })}
            </div>
          )}
        </Flexbox>
      ),
      type: 'group',
    },
  ];

  return items;
};
