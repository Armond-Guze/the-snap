import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") || "";
  if (!/^[a-zA-Z0-9_-]{1,240}$/.test(slug))
    return NextResponse.json({ error: "Invalid article" }, { status: 400 });
  try {
    const article = await client.fetch<{
      title: string;
      summary?: string;
      paragraphs: string[];
    } | null>(
      `*[_type=="article" && published==true && !(_id in path("drafts.**")) && slug.current==$slug][0]{title,summary,"paragraphs":body[_type=="block"]{"text":pt::text(@)}.text}`,
      { slug },
      { cache: "no-store" },
    );
    if (!article)
      return NextResponse.json({ error: "Story unavailable" }, { status: 404 });
    return NextResponse.json(article, {
      headers: {
        "Cache-Control": "public, max-age=60",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch {
    return NextResponse.json({ error: "Reader unavailable" }, { status: 503 });
  }
}
