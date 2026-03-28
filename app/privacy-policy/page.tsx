import { SimpleList, SimplePageShell, SimpleSection } from "../components/SimpleInfoPage";

export const metadata = {
  title: "Privacy Policy | The Game Snap",
  description: "Privacy practices, data collection, cookies, and user rights for The Game Snap.",
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
            "Basic usage information such as device type, browser type, and IP address.",
            "Cookie and analytics data used to understand traffic and improve the site experience.",
            "Information you choose to send when you contact us or subscribe to a newsletter.",
          ]}
        />
      </SimpleSection>

      <SimpleSection title="How we use it">
        <SimpleList
          items={[
            "Improve site performance, navigation, and content decisions.",
            "Respond to messages, support requests, or newsletter signups.",
            "Measure traffic, engagement, and search visibility.",
            "Support advertising and analytics services where enabled.",
          ]}
        />
      </SimpleSection>

      <SimpleSection title="Cookies and third-party services">
        <p>
          The Snap may use cookies and similar technologies to understand how the site is used and to support analytics
          or advertising partners. Third-party services may set their own cookies under their own policies.
        </p>
        <p>
          You can control or block cookies through your browser settings. Some site features may behave differently if
          those cookies are disabled.
        </p>
      </SimpleSection>

      <SimpleSection title="Your rights">
        <p>
          You may request access to, correction of, or deletion of personal information you have provided directly to
          the site. For privacy-related requests, email{" "}
          <a href="mailto:thegamesnap@yahoo.com" className="font-semibold text-white transition hover:text-white/75">
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

      <p className="text-sm text-white/40">
        Last updated:{" "}
        {new Date().toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </SimplePageShell>
  );
}
