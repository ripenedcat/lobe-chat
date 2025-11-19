import { ItemType } from '@lobehub/ui';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

const CHECKPOINT_WEEK_OPTIONS = [
  'Checkpoint Week1',
  'Checkpoint Week2',
  'Checkpoint Week3',
  'Checkpoint Week4',
  'Checkpoint Week5',
] as const;

export type CheckpointWeekOption = (typeof CHECKPOINT_WEEK_OPTIONS)[number];

export const useControls = ({ setUpdating }: { setUpdating: (updating: boolean) => void }) => {
  const { t } = useTranslation('setting');
  const [currentCheckpointWeek, setCheckpointWeek] = useAgentStore((s) => [
    agentSelectors.currentAgentCheckpointWeek(s),
    s.setCheckpointWeek,
  ]);

  const items: ItemType[] = [
    {
      children: CHECKPOINT_WEEK_OPTIONS.map((week) => ({
        icon: currentCheckpointWeek === week ? <Check size={16} /> : <div style={{ width: 16 }} />,
        key: week,
        label: week,
        onClick: async () => {
          setUpdating(true);
          await setCheckpointWeek(week);
          setUpdating(false);
        },
      })),
      key: 'checkpoint-week-group',
      label: t('checkpointWeek.title'),
      type: 'group',
    },
  ];

  return items;
};
