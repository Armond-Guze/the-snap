export const metadata = {
  title: "Terms of Use | The Game Snap",
  description: "Terms of Use governing access to and use of The Game Snap website.",
};

export default function TermsOfUse() {
  const year = new Date().getFullYear();
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-black" />
        <div className="relative mx-auto max-w-4xl">
          <header className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">Terms of Use</h1>
            <div className="w-24 h-1 bg-white mx-auto mb-8" />
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              These Terms of Use (&quot;Terms&quot;) govern your access to and use of the website located at <strong className="text-white">The Game Snap</strong> (the &quot;Site&quot;). By accessing or using the Site, you agree to be bound by these Terms.
            </p>
          </header>

          <main className="space-y-16">
            <Section title="1. Acceptance of Terms">
              By using the Site, you confirm that you are at least 13 years old and capable of entering into a binding agreement. If you do not agree with these Terms, do not use the Site.
            </Section>

            <Section title="2. Changes to the Site & Terms">
              We may modify or discontinue any part of the Site at any time. We may also update these Terms. Continued use after changes constitutes acceptance. A Last Updated date will appear at the bottom of this page.
            </Section>

            <Section title="3. Intellectual Property">
              All articles, graphics, logos, design elements, and other content on the Site are owned by or licensed to The Game Snap and protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without prior written permission, except for personal, non-commercial use with proper attribution.
            </Section>

            <Section title="4. User Conduct">
              You agree not to: (a) use the Site for unlawful purposes; (b) attempt to gain unauthorized access to systems; (c) harvest data or deploy automated scraping without consent; (d) interfere with Site performance; or (e) impersonate any person or entity.
            </Section>

            <Section title="5. Content & Accuracy Disclaimer">
              The Site provides analysis, rankings, and opinions related to football. Content is for informational and entertainment purposes only. We make no guarantees about completeness, accuracy, or timeliness.
            </Section>

            <Section title="6. Third-Party Links & Services">
              The Site may contain links to third-party websites or display third-party ads (including Google AdSense). We do not control and are not responsible for third-party content or practices. Use of third-party sites is at your own risk.
            </Section>

            <Section title="7. No Professional Advice">
              Any fantasy football or strategic recommendations are opinions only and not professional advice. You assume full responsibility for decisions based on Site content.
            </Section>

            <Section title="8. Limitation of Liability">
              To the fullest extent permitted by law, The Game Snap and its contributors are not liable for any indirect, incidental, special, consequential, or punitive damages, or loss of data, profits, or reputation arising from Site use.
            </Section>

            <Section title="9. Disclaimer of Warranties">
              The Site is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, or non-infringement. We do not warrant uninterrupted or error-free operation.
            </Section>

            <Section title="10. Indemnification">
              You agree to defend, indemnify, and hold harmless The Game Snap, its operators, and contributors from any claims, liabilities, damages, losses, and expenses (including legal fees) arising from your misuse of the Site or violation of these Terms.
            </Section>

            <Section title="11. Termination">
              We may suspend or terminate your access to the Site without notice if we believe you have violated these Terms.
            </Section>

            <Section title="12. Governing Law">
              These Terms are governed by the laws of the jurisdiction in which the Site is operated, without regard to conflict-of-law principles.
            </Section>

            <Section title="13. Contact">
              Questions about these Terms? Email us at {" "}
              <a
                href="mailto:thegamesnap@yahoo.com"
                className="text-white hover:underline font-semibold transition-colors"
              >
                thegamesnap@yahoo.com
              </a>.
            </Section>
          </main>

          <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>Last Updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="mt-2">© {year} The Game Snap. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{title}</h2>
      <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">{children}</p>
    </section>
  );
}
