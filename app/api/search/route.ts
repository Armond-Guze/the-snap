import { NextRequest } from "next/server";

import { client } from "@/sanity/lib/client";

export const revalidate = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  if (query.length < 2) {
    return new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 8, 1), 12);
  const searchPattern = `*${query.slice(0, 80)}*`;
  const items = await client.fetch(
    `
    *[
      (( _type == "article" && format == "headline" ) || _type == "headline" || _type == "rankings") &&
      published == true && (
        title match $searchPattern ||
        summary match $searchPattern ||
        category->title match $searchPattern ||
        author->name match $searchPattern ||
        rankingType match $searchPattern
      )
    ]
    | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc)[0...${limit}] {
      _id,
      _type,
      title,
      slug,
      summary,
      coverImage { asset->{ url } },
      category-> {
        title,
        slug
      },
      author-> {
        name
      },
      date
    }
    `,
    { searchPattern }
  );

  return new Response(JSON.stringify({ items }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
    },
  });
}
