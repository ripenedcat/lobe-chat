import { Switch } from 'antd';
import { FC } from 'react';

import InstantSwitch from '@/components/InstantSwitch';
import { useAiInfraStore } from '@/store/aiInfra';

interface SwitchProps {
  Component?: FC<{ enabled: boolean; id: string }>;
  enabled: boolean;
  id: string;
}

const EnableSwitch = ({ id, Component, enabled }: SwitchProps) => {
  const [toggleProviderEnabled] = useAiInfraStore((s) => [s.toggleProviderEnabled]);

  // GitHub Copilot provider cannot be disabled
  if (id === 'githubcopilot') {
    return <Switch checked={true} disabled size={'small'} />;
  }

  // slot for cloud
  if (Component) return <Component enabled={enabled} id={id} />;

  return (
    <InstantSwitch
      enabled={enabled}
      onChange={async (checked) => {
        await toggleProviderEnabled(id, checked);
      }}
      size={'small'}
    />
  );
};

export default EnableSwitch;
