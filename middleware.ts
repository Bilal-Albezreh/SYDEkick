// import { createServerClient, type CookieOptions } from "@supabase/ssr";
// import { NextResponse, type NextRequest } from "next/server";

// export async function middleware(request: NextRequest) {
//   let response = NextResponse.next({
//     request: {
//       headers: request.headers,
//     },
//   });

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get(name: string) {
//           return request.cookies.get(name)?.value;
//         },
//         set(name: string, value: string, options: CookieOptions) {
//           request.cookies.set({
//             name,
//             value,
//             ...options,
//           });
//           response = NextResponse.next({
//             request: {
//               headers: request.headers,
//             },
//           });
//           response.cookies.set({
//             name,
//             value,
//             ...options,
//           });
//         },
//         remove(name: string, options: CookieOptions) {
//           request.cookies.set({
//             name,
//             value: "",
//             ...options,
//           });
//           response = NextResponse.next({
//             request: {
//               headers: request.headers,
//             },
//           });
//           response.cookies.set({
//             name,
//             value: "",
//             ...options,
//           });
//         },
//       },
//     }
//   );

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   // ROUTE PROTECTION LOGIC
//   const path = request.nextUrl.pathname;

//   // 1. If user is NOT logged in, kick them to login (unless they are already there)
//   if (!user && path !== "/login" && path !== "/auth/callback") {
//     return NextResponse.redirect(new URL("/login", request.url));
//   }

//   // 2. If user IS logged in:
//   if (user) {
//     // A. Check Approval Status
//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("is_approved")
//       .eq("id", user.id)
//       .single();

//     const isApproved = profile?.is_approved ?? false;

//     // B. If NOT approved and trying to access main app -> Send to Locked
//     if (!isApproved && path !== "/locked" && path !== "/login") {
//       return NextResponse.redirect(new URL("/locked", request.url));
//     }

//     // C. If approved but stuck on /locked -> Free them to Dashboard
//     if (isApproved && path === "/locked") {
//       return NextResponse.redirect(new URL("/", request.url));
//     }

//     // D. If logged in and trying to access login page -> Send to Dashboard
//     if (path === "/login") {
//       return NextResponse.redirect(new URL("/", request.url));
//     }
//   }

//   return response;
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * Feel free to modify this pattern to include more paths.
//      */
//     "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
//   ],
// };
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Use getSession() instead of getUser() for faster Edge execution
  const { data: { session } } = await supabase.auth.getSession();
  const path = request.nextUrl.pathname;

  // ====================================================================
  // PUBLIC ROUTES: Allow unauthenticated access to these paths
  // ====================================================================
  const publicRoutes = ["/", "/login", "/auth/callback", "/locked"];

  if (publicRoutes.includes(path)) {
    // If logged in and trying to access the landing page or login, redirect to dashboard
    if (session && (path === "/" || path === "/login")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Allow public access
    return response;
  }

  // ====================================================================
  // PROTECTED ROUTES: Require authentication for /dashboard, /tracker, etc.
  // ====================================================================
  if (!session) {
    // No session found - redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // User is authenticated - allow access to protected routes
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};