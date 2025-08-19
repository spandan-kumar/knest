import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isPublicRoute = nextUrl.pathname.startsWith('/auth');
  const isApiRoute = nextUrl.pathname.startsWith('/api');
  const isRootRoute = nextUrl.pathname === '/';

  console.log('Middleware debug:', {
    pathname: nextUrl.pathname,
    isLoggedIn,
    hasAuth: !!req.auth,
    user: req.auth?.user
  });

  // Allow all auth API routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Allow public auth pages
  if (isPublicRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', nextUrl));
    }
    return NextResponse.next();
  }

  // Protect API routes (except auth)
  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Protect main app routes - redirect to sign in if not logged in
  if (!isLoggedIn && (isRootRoute || !isPublicRoute)) {
    console.log('Redirecting to sign-in - not authenticated');
    return NextResponse.redirect(new URL('/auth/signin', nextUrl));
  }

  return NextResponse.next();
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};