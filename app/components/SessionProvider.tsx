'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface SessionProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={5 * 60} // Refetch session every 5 minutes instead of default 60 seconds
      refetchOnWindowFocus={true} // Keep window focus check
    >
      {children}
    </NextAuthSessionProvider>
  );
}