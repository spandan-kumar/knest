import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SessionProvider from '../components/SessionProvider';
import MeetingsClient from './MeetingsClient';

export default async function MeetingsPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <SessionProvider session={session}>
      <MeetingsClient session={session} />
    </SessionProvider>
  );
}
