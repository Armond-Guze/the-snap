import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Content Migration | The Snap Admin",
  description: "Internal content migration tools for The Snap.",
  path: "/admin/migration",
  noIndex: true,
});

export default function MigrationPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Content Migration</h1>
      <p>Migration tools will be available here.</p>
    </div>
  );
}
