import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import { SimplePageShell, SimpleSection } from "../components/SimpleInfoPage";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Use | The Game Snap",
  description: "Terms of Use governing access to and use of The Game Snap website.",
  path: "/terms",
});

const sections = [
  {
    title: "Acceptance of terms",
    body: "By using The Snap, you agree to these terms. If you do not agree, do not use the site.",
  },
  {
    title: "Content and ownership",
    body: "Site content, design, logos, and written material are owned by or licensed to The Snap unless otherwise stated. You may not republish or reproduce site content for commercial use without permission.",
  },
  {
    title: "Use of the site",
    body: "You agree not to misuse the site, interfere with performance, scrape content without permission, or attempt unauthorized access to any systems or accounts.",
  },
  {
    title: "Accuracy disclaimer",
    body: "The Snap publishes news, rankings, analysis, and opinion. Content is provided for informational and entertainment purposes and may change as events develop.",
  },
  {
    title: "Third-party services",
    body: "The site may link to or rely on third-party services, including analytics, ads, newsletter providers, or external websites. Those services operate under their own terms and policies.",
  },
  {
    title: "Liability",
    body: "The Snap is provided on an as-is basis. To the fullest extent permitted by law, we are not liable for losses, damages, or decisions made based on content published on the site.",
  },
  {
    title: "Updates",
    body: "These terms may be updated from time to time. Continued use of the site after changes means you accept the updated version.",
  },
];

export default function TermsOfUse() {
  const year = new Date().getFullYear();

  return (
    <SimplePageShell
      eyebrow="Legal"
      title="Terms of Use"
      intro="These terms govern access to and use of The Snap. They are written to be direct, readable, and clear about how the site should be used."
    >
      {sections.map((section) => (
        <SimpleSection key={section.title} title={section.title}>
          <p>{section.body}</p>
        </SimpleSection>
      ))}

      <SimpleSection title="Contact">
        <p>
          Questions about these terms can be sent to{" "}
          <a href="mailto:thegamesnap@yahoo.com" className="font-semibold text-white transition hover:text-white/75">
            thegamesnap@yahoo.com
          </a>
          .
        </p>
      </SimpleSection>

      <p className="text-sm text-white/40">
        Last updated:{" "}
        {new Date().toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}{" "}
        · © {year} The Snap
      </p>
    </SimplePageShell>
  );
}
