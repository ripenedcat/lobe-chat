import { ItemType } from '@lobehub/ui';
import { Check } from 'lucide-react';

import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

const COLLECTION_OPTIONS = ['azure_monitor', 'test_monitor'] as const;

export type CollectionOption = (typeof COLLECTION_OPTIONS)[number];

export const useControls = ({ setUpdating }: { setUpdating: (updating: boolean) => void }) => {
  const [currentCollection, setCollection] = useAgentStore((s) => [
    agentSelectors.currentAgentCollection(s),
    s.setCollection,
  ]);

  const items: ItemType[] = COLLECTION_OPTIONS.map((collection) => ({
    icon: currentCollection === collection ? <Check size={16} /> : <div style={{ width: 16 }} />,
    key: collection,
    label: collection,
    onClick: async () => {
      setUpdating(true);
      await setCollection(collection);
      setUpdating(false);
    },
  }));

  return items;
};
