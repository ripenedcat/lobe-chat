import { memo } from 'react';

interface ActionsProps {
  id?: string;
  isCustomGroup?: boolean;
  isPinned?: boolean;
  onOpenChange?: (open: boolean) => void;
  openConfigModal: () => void;
  openRenameModal?: () => void;
}

const Actions = memo<ActionsProps>(() => {
  // Disabled: Group management is not allowed
  return null;
});

export default Actions;
