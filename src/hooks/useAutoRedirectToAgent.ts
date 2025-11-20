import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { INBOX_SESSION_ID } from '@/const/session';
import { SESSION_CHAT_URL } from '@/const/url';
import { useSessionStore } from '@/store/session';

/**
 * Auto redirect to the last used agent or readiness-plan-agent
 * when user visits the chat page without a specific session
 */
export const useAutoRedirectToAgent = () => {
  const router = useRouter();
  const redirected = useRef(false);

  const activeId = useSessionStore((s) => s.activeId);
  const sessions = useSessionStore((s) => s.sessions);

  useEffect(() => {
    // Only redirect once
    if (redirected.current) return;

    // If already on a specific session (not inbox), don't redirect
    if (activeId && activeId !== INBOX_SESSION_ID) {
      redirected.current = true;
      return;
    }

    // If on inbox or no active session, redirect to last used agent or readiness-plan-agent
    if (activeId === INBOX_SESSION_ID || !activeId) {
      // Find the readiness-plan-agent
      const readinessPlanAgent = sessions.find(
        (session) => 'slug' in session && session.slug === 'readiness-plan-agent',
      );

      // Find the most recently updated session (excluding inbox)
      const sortedSessions = [...sessions]
        .filter((session) => session.id !== INBOX_SESSION_ID)
        .sort((a, b) => {
          const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return timeB - timeA;
        });

      const lastUsedSession = sortedSessions[0];

      // Redirect to the last used session, or readiness-plan-agent if no last used session
      const targetSession = lastUsedSession || readinessPlanAgent;

      if (targetSession) {
        console.log(
          '[useAutoRedirectToAgent] Redirecting to:',
          targetSession.id,
          'slug' in targetSession ? targetSession.slug : '',
        );
        redirected.current = true;
        router.replace(SESSION_CHAT_URL(targetSession.id));
      }
    }
  }, [activeId, sessions, router]);
};
