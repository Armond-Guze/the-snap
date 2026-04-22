<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into **The Snap** (Next.js 16 App Router). Here is a summary of all changes made:

- **`instrumentation-client.ts`** (new): Initializes `posthog-js` client-side using the Next.js 15.3+ instrumentation API. Configured with the reverse-proxy `/ingest` host, `defaults: '2026-01-30'`, and `capture_exceptions: true` for automatic error tracking.
- **`lib/posthog-server.ts`** (new): Singleton server-side PostHog client using `posthog-node`, used in API routes.
- **`next.config.ts`**: Added PostHog reverse-proxy rewrites (`/ingest/static/*`, `/ingest/array/*`, `/ingest/*`) and `skipTrailingSlashRedirect: true`. Also added `https://us.i.posthog.com` and `https://us-assets.i.posthog.com` to both CSP `connect-src` directives (base and studio).
- **`.env.local`**: Added `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`.

## Events Instrumented

| Event | Description | File |
|---|---|---|
| `newsletter_subscribed` | User successfully subscribes to the newsletter | `app/components/NewsletterSignup.tsx` |
| `newsletter_subscribe_failed` | Newsletter subscription failed (API/validation error) | `app/components/NewsletterSignup.tsx` |
| `article_shared` | User shares an article to Twitter, Facebook, or LinkedIn | `app/components/SocialShare.tsx` |
| `article_link_copied` | User copies the article link via the copy button | `app/components/SocialShare.tsx` |
| `favorite_team_selected` | User selects or changes their favorite NFL team | `app/components/ProfileMenu.tsx` |
| `favorite_team_cleared` | User clears their favorite team selection | `app/components/ProfileMenu.tsx` |
| `sign_in_clicked` | User clicks Log In in the profile menu (auth funnel entry) | `app/components/ProfileMenu.tsx` |
| `sign_up_clicked` | User clicks Sign Up in the profile menu (registration funnel entry) | `app/components/ProfileMenu.tsx` |
| `schedule_team_filter_applied` | User filters the NFL schedule by a specific team | `app/schedule/TeamFilterClient.tsx` |
| `mock_draft_completed` | Server-side: fantasy mock draft simulation successfully run | `app/api/fantasy/mock-draft/route.ts` |
| `user_created` | Server-side: new user account created via Clerk webhook | `app/api/webhooks/clerk/route.ts` |

## Next steps

We've built an **Analytics basics** dashboard and five insights to give you immediate visibility into user behavior:

- **Dashboard**: https://us.posthog.com/project/392085/dashboard/1497232

### Insights

1. **Newsletter Subscriptions Over Time** — daily trend of the primary conversion event
   https://us.posthog.com/project/392085/insights/VwrNPVnA

2. **Newsletter Signup Conversion Funnel** — `sign_up_clicked` → `newsletter_subscribed`
   https://us.posthog.com/project/392085/insights/KWQRzxnN

3. **Article Shares by Platform** — sharing activity broken down by twitter/facebook/linkedin
   https://us.posthog.com/project/392085/insights/fRKHJIN6

4. **New User Registration Funnel** — `sign_up_clicked` → `user_created` (full signup conversion)
   https://us.posthog.com/project/392085/insights/PkOqn43Q

5. **Feature Engagement: Fantasy, Schedule & Personalization** — weekly trend of mock drafts, schedule filters, and team selections
   https://us.posthog.com/project/392085/insights/gsGSlaVx

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
