import { Package } from 'lucide-react';
import { Suspense, memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

import Action from '../components/Action';
import { useControls } from './useControls';

const Collection = memo(() => {
  const { t } = useTranslation('setting');
  const [updating, setUpdating] = useState(false);
  const items = useControls({ setUpdating });

  const selectedCollection = useAgentStore(agentSelectors.currentAgentCollection);

  return (
    <Suspense fallback={<Action disabled icon={Package} title={t('collection.title')} />}>
      <Action
        dropdown={{
          maxHeight: 300,
          maxWidth: 320,
          menu: { items },
          minWidth: 240,
        }}
        icon={Package}
        loading={updating}
        showTooltip={false}
        title={selectedCollection || t('collection.title')}
      />
    </Suspense>
  );
});

export default Collection;
