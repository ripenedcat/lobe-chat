import { Calendar } from 'lucide-react';
import { Suspense, memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

import Action from '../components/Action';
import { useControls } from './useControls';

const CheckpointWeek = memo(() => {
  const { t } = useTranslation('setting');
  const [updating, setUpdating] = useState(false);
  const items = useControls({ setUpdating });

  const selectedCheckpointWeek = useAgentStore(agentSelectors.currentAgentCheckpointWeek);

  return (
    <Suspense fallback={<Action disabled icon={Calendar} title={t('checkpointWeek.title')} />}>
      <Action
        dropdown={{
          maxHeight: 300,
          maxWidth: 320,
          menu: { items },
          minWidth: 240,
        }}
        icon={Calendar}
        loading={updating}
        showTooltip={false}
        title={selectedCheckpointWeek || t('checkpointWeek.title')}
      />
    </Suspense>
  );
});

export default CheckpointWeek;
