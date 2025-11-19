import { Icon } from '@lobehub/ui';
import { Checkbox } from 'antd';
import { Loader2 } from 'lucide-react';
import { ReactNode, memo, useState } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

export interface CheckboxItemProps {
  checked?: boolean;
  disabled?: boolean;
  id: string;
  label?: ReactNode;
  onUpdate: (id: string, enabled: boolean) => Promise<void>;
}

const CheckboxItem = memo<CheckboxItemProps>(({ id, onUpdate, label, checked, disabled }) => {
  const [loading, setLoading] = useState(false);

  const updateState = async () => {
    if (disabled) return;
    setLoading(true);
    await onUpdate(id, !checked);
    setLoading(false);
  };

  return (
    <Flexbox
      gap={24}
      horizontal
      justify={'space-between'}
      onClick={async (e) => {
        e.stopPropagation();
        if (!disabled) {
          updateState();
        }
      }}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        paddingLeft: 8,
      }}
    >
      {label || id}
      {loading ? (
        <Center width={18}>
          <Icon icon={Loader2} spin />
        </Center>
      ) : (
        <Checkbox
          checked={checked}
          disabled={disabled}
          onClick={async (e) => {
            e.stopPropagation();
            if (!disabled) {
              await updateState();
            }
          }}
        />
      )}
    </Flexbox>
  );
});

export default CheckboxItem;
