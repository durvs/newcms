import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Routes that require authentication */
const ADMIN_ROUTES = [
	'/dashboard',
	'/posts',
	'/users',
	'/settings',
	'/comments',
	'/menus',
	'/templates',
	'/editor',
];

function isAdminRoute(pathname: string): boolean {
	return ADMIN_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

export function middleware(request: NextRequest) {
	const token = request.cookies.get('newcms_token')?.value;
	const { pathname } = request.nextUrl;

	// Login page
	if (pathname === '/login') {
		if (token) return NextResponse.redirect(new URL('/dashboard', request.url));
		return NextResponse.next();
	}

	// Admin routes — require auth
	if (isAdminRoute(pathname)) {
		if (!token) return NextResponse.redirect(new URL('/login', request.url));
		return NextResponse.next();
	}

	// Public routes — no auth required
	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|api|uploads/).*)'],
};
