import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const destination = new URL(
    `/studio/intent/create/type=article;id=${randomUUID()}/`,
    request.url,
  );
  const response = NextResponse.redirect(destination, 307);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
