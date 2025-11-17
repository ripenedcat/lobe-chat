import { Icon, Tag, Tooltip } from '@lobehub/ui';
import { Package } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

const CollectionTag = memo(() => {
  const { t } = useTranslation('setting');
  const collection = useAgentStore(agentSelectors.currentAgentCollection);

  return (
    <Tooltip title={t('collection.title')}>
      <Flexbox height={22}>
        <Tag>
          <Icon icon={Package} />
          <span>{collection}</span>
        </Tag>
      </Flexbox>
    </Tooltip>
  );
});

export default CollectionTag;
