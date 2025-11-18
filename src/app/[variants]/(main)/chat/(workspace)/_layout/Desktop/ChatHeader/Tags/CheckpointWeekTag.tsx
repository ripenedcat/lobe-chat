import { Icon, Tag, Tooltip } from '@lobehub/ui';
import { Calendar } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

const CheckpointWeekTag = memo(() => {
  const { t } = useTranslation('setting');
  const checkpointWeek = useAgentStore(agentSelectors.currentAgentCheckpointWeek);

  return (
    <Tooltip title={t('checkpointWeek.title')}>
      <Flexbox height={22}>
        <Tag>
          <Icon icon={Calendar} />
          <span>{checkpointWeek}</span>
        </Tag>
      </Flexbox>
    </Tooltip>
  );
});

export default CheckpointWeekTag;
