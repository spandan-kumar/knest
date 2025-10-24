import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SessionProvider from '@/app/components/SessionProvider';
import MeetingDetailClient from './MeetingDetailClient';

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const resolvedParams = await params;

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <SessionProvider session={session}>
      <MeetingDetailClient session={session} meetingId={resolvedParams.id} />
    </SessionProvider>
  );
}
