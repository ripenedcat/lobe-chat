import { memo } from 'react';


const AddButton = memo<{ groupId?: string }>(() => {
  // Disabled: New assistants are not allowed
  return null;
});

export default AddButton;
