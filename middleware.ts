import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

const ADMIN_ROUTES = ['/monitoring', '/plans', '/assets']

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // 1. Defensive check for environment variables in Edge Runtime
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[Middleware] Missing Supabase environment variables')
        return response
    }

    try {
        const supabase = createServerClient<Database>(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        const {
            data: { user },
            error: userError
        } = await supabase.auth.getUser()

        if (userError) {
            console.error('[Middleware] Auth error:', userError)
        }

        const pathname = request.nextUrl.pathname

        // Protect dashboard routes
        if (!user && pathname.startsWith('/dashboard')) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Triple Protection: Admin route guard
        const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))

        if (isAdminRoute) {
            if (!user) {
                const url = request.nextUrl.clone()
                url.pathname = '/login'
                return NextResponse.redirect(url)
            }

            // Using maybeSingle() to avoid throwing on missing profiles
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_superadmin')
                .eq('id', user.id)
                .maybeSingle()

            if (profileError) {
                console.error('[Middleware] Profile error:', profileError)
            }

            if (!profile?.is_superadmin) {
                const url = request.nextUrl.clone()
                url.pathname = '/403'
                return NextResponse.redirect(url)
            }
        }
    } catch (error) {
        console.error('[Middleware] Critical failure:', error)
        // Ensure we don't break the whole site if middleware fails
        return NextResponse.next()
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
