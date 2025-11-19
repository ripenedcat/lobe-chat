import { useEffect } from 'react';

import { sessionService } from '@/services/session';

export const useUpdateDefaultAssistantsAvatars = (isLogin: boolean | undefined) => {
  useEffect(() => {
    const updateAvatars = async () => {
      // Only run when user is logged in
      if (!isLogin) {
        console.log('[useUpdateDefaultAssistantsAvatars] User not logged in, skipping');
        return;
      }

      console.log('[useUpdateDefaultAssistantsAvatars] Starting avatar update process');

      try {
        await sessionService.updateDefaultAssistantsAvatars();
        console.log(
          '[useUpdateDefaultAssistantsAvatars] Successfully updated default assistants avatars',
        );
      } catch (error) {
        console.error('[useUpdateDefaultAssistantsAvatars] Failed to update avatars:', error);
        // Don't throw - we don't want to break the app if this fails
      }
    };

    updateAvatars();
  }, [isLogin]);
};
