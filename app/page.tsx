import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SessionProvider from './components/SessionProvider';
import MeetingAnalyzer from './components/meeting/MeetingAnalyzer';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <SessionProvider session={session}>
      <MeetingAnalyzer session={session} />
    </SessionProvider>
  );
}