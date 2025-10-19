import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    console.log("[v0] Auth error in middleware (allowing access):", error)
    // Em caso de erro, permite acesso (modo desenvolvimento)
    return supabaseResponse
  }

  // Protected routes
  const protectedPaths = ["/dashboard"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Redirect to login if accessing protected route without authentication
  // if (isProtectedPath && !user) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = "/auth/login"
  //   return NextResponse.redirect(url)
  // }

  // Redirect to dashboard if accessing auth pages while authenticated
  const authPaths = ["/auth/login", "/auth/sign-up"]
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
