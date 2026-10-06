import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseSavedStories } from "@/lib/saved-stories";
import { readingAuth, smallJson } from "../_reading-auth";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };

async function handle(request: NextRequest) {
  try {
    const userId = await readingAuth(request);
    if (typeof userId !== "string") return userId;
    if (request.method === "GET")
      return NextResponse.json(
        {
          stories: await db.savedArticle.findMany({
            where: { userId },
            orderBy: { savedAt: "desc" },
            select: { href: true, title: true, savedAt: true },
            take: 200,
          }),
        },
        { headers },
      );
    const body = await smallJson(request);
    const story = parseSavedStories(
      JSON.stringify([
        {
          ...body,
          savedAt: new Date().toISOString(),
          title: request.method === "DELETE" ? "Remove" : body?.title,
        },
      ]),
    )[0];
    if (!story || story.href.length > 300)
      return NextResponse.json(
        { error: "Invalid story" },
        { status: 400, headers },
      );
    if (request.method === "DELETE")
      await db.savedArticle.deleteMany({ where: { userId, href: story.href } });
    else
      await db.$transaction(async (tx) => {
        // Serialize additions for this account so concurrent requests cannot exceed the cap.
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId}::uuid FOR UPDATE`;
        const existing = await tx.savedArticle.findUnique({
          where: { userId_href: { userId, href: story.href } },
        });
        if (
          !existing &&
          (await tx.savedArticle.count({ where: { userId } })) >= 200
        )
          throw new Error("LIST_FULL");
        await tx.savedArticle.upsert({
          where: { userId_href: { userId, href: story.href } },
          create: { userId, href: story.href, title: story.title },
          update: { title: story.title },
        });
      });
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message === "LIST_FULL"
            ? "Your list is full. Remove a story first."
            : "Your saved stories could not be updated. Please retry.",
      },
      {
        status:
          error instanceof Error && error.message === "LIST_FULL" ? 409 : 503,
        headers,
      },
    );
  }
}
export const GET = handle;
export const PUT = handle;
export const DELETE = handle;
