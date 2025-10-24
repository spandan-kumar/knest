import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SessionProvider from '../components/SessionProvider';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <SessionProvider session={session}>
      <SettingsClient session={session} />
    </SessionProvider>
  );
}
