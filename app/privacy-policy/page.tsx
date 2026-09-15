import type { Metadata } from "next";
import { SimpleList, SimplePageShell, SimpleSection } from "../components/SimpleInfoPage";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy | The Snap",
  description: "Privacy practices, data collection, cookies and user rights for The Snap.",
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
  openGraph: {
    title: "Privacy Policy | The Snap",
    description: "Privacy practices, data collection, cookies and user rights for The Snap.",
    url: `${SITE_URL}/privacy-policy`,
    type: "website",
  },
};

export default function PrivacyPolicy() {
  return (
    <SimplePageShell
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This page explains what information The Snap collects, how it is used, and what choices you have when using the site."
    >
      <SimpleSection title="Information we collect">
        <SimpleList
          items={[
            "Contact and newsletter information you choose to provide, such as an email address and message.",
            "Account identifiers and authentication events when you use an account feature.",
            "Basic request, security, and device information such as IP address, browser, referring page, and timestamps.",
            "Analytics, advertising, and consent data only when the applicable service is enabled and your choices allow it.",
          ]}
        />
      </SimpleSection>

      <SimpleSection title="How we use it">
        <SimpleList
          items={[
            "Improve site performance, navigation, and content decisions.",
            "Deliver requested emails, process unsubscribes, and respond to messages or support requests.",
            "Measure traffic, engagement, and search visibility.",
            "Prevent abuse, secure the site, comply with law, and maintain records of privacy choices.",
            "Support advertising and analytics services where enabled and permitted.",
          ]}
        />
      </SimpleSection>

      <SimpleSection title="Service providers and data sharing">
        <p>
          The site is hosted by Vercel and uses Sanity for public editorial content, Clerk for account authentication,
          Formspree for contact-form delivery, Resend for newsletter confirmation and delivery, and a private database
          provider for newsletter records. These providers may process limited information needed to supply and secure
          their services.
        </p>
        <p>
          Google Analytics, Google AdSense, and third-party video or social embeds may also process data when those
          features are enabled and your consent choices permit them. External links are governed by the destination&apos;s
          privacy practices. We do not publish newsletter subscriber addresses in the public editorial dataset.
        </p>
      </SimpleSection>

      <SimpleSection title="Cookies and your choices">
        <p>
          Optional analytics and advertising scripts remain disabled unless you accept them. You can reject optional
          cookies when prompted and can change or withdraw that choice later through the Cookie preferences button in
          the site footer. Browser controls provide additional choices.
        </p>
      </SimpleSection>

      <SimpleSection title="Retention and security">
        <p>
          Newsletter records are kept until you unsubscribe or request deletion, subject to a limited suppression or
          compliance record when necessary to honor an opt-out. Unconfirmed signup requests expire after 24 hours and
          are removed by the daily retention job. Contact messages are kept only as long as reasonably
          needed to respond, maintain support history, prevent abuse, or meet legal obligations. Provider security and
          analytics logs follow the applicable provider settings and retention periods. When first-party article
          analytics are enabled, pseudonymous event records are retained for no more than 13 months and expired abuse
          prevention counters are pruned automatically.
        </p>
        <p>
          We use reasonable technical and organizational safeguards, but no internet transmission or storage system can
          be guaranteed completely secure.
        </p>
      </SimpleSection>

      <SimpleSection title="Legal bases and international processing">
        <p>
          Depending on location and context, processing may rely on consent, performance of a requested service,
          legitimate interests such as security and site improvement, or compliance with law. Providers may process
          information in the United States or other countries using the transfer protections available to them.
        </p>
      </SimpleSection>

      <SimpleSection title="Your rights">
        <p>
          Depending on where you live, you may request access, correction, deletion, portability, restriction, or an
          appeal, and may opt out of certain targeted advertising, sale, or sharing as those terms are defined by law.
          We do not discriminate for exercising applicable privacy rights. To make a request, email{" "}
          <a href="mailto:thegamesnap@yahoo.com" className="font-semibold text-neutral-900 transition hover:text-neutral-600">
            thegamesnap@yahoo.com
          </a>
          .
        </p>
      </SimpleSection>

      <SimpleSection title="Children’s privacy">
        <p>
          The site is intended for users age 13 and older. We do not knowingly collect personal information from
          children under 13.
        </p>
      </SimpleSection>

      <p className="text-sm text-neutral-600">
        Last updated:{" "}
        August 9, 2026
      </p>
    </SimplePageShell>
  );
}
