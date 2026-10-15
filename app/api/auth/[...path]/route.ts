import { neonAuth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

// Neon Auth requires this exact mount path; every Managed Better Auth SDK call is proxied here.
export function GET(request: Request, context: RouteContext) {
  return neonAuth().handler().GET(request, context);
}

export function POST(request: Request, context: RouteContext) {
  return neonAuth().handler().POST(request, context);
}

export function PUT(request: Request, context: RouteContext) {
  return neonAuth().handler().PUT(request, context);
}

export function DELETE(request: Request, context: RouteContext) {
  return neonAuth().handler().DELETE(request, context);
}

export function PATCH(request: Request, context: RouteContext) {
  return neonAuth().handler().PATCH(request, context);
}
