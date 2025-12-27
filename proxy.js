import { NextResponse } from "next/server";

export function proxy(request) {
  // Only protect /admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      // Decode JWT payload to check role
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      const payload = JSON.parse(jsonPayload);

      if (payload.role !== "admin") {
        // Return 403 Forbidden for API calls
        if (request.nextUrl.pathname.startsWith("/api/")) {
          return new NextResponse(
            JSON.stringify({ success: false, error: "Forbidden" }),
            { status: 403, headers: { "content-type": "application/json" } }
          );
        }

        // For pages, we can't easily perform a generic "403" render in middleware without rewriting to a page.
        // We will rewrite to a custom 403 page or just return text.
        // Simplest compliant way:
        return new NextResponse(
          "403 Forbidden: You do not have access to this page.",
          { status: 403 }
        );
      }
    } catch (e) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
