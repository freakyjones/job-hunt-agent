import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const basicAuth = req.headers.get('authorization');
    const url = req.nextUrl;

    // We only protect the application routes, skip static files, images, etc.
    if (url.pathname.startsWith('/_next') || url.pathname === '/favicon.ico') {
        return NextResponse.next();
    }

    const expectedPassword = process.env.DASHBOARD_PASSWORD;

    if (expectedPassword) {
        if (basicAuth) {
            const authValue = basicAuth.split(' ')[1];
            const [user, pwd] = Buffer.from(authValue, 'base64').toString().split(':');

            if (user === 'admin' && pwd === expectedPassword) {
                return NextResponse.next();
            }
        }

        url.pathname = '/api/auth';
        return new NextResponse('Auth required', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Secure Dashboard"',
            },
        });
    }

    // If no password is set in the environment, let them through (for local dev)
    return NextResponse.next();
}
