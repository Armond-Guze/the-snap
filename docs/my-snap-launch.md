# My Snap: reading list, offline text, and team alerts

## Production rollout — September 29, 2026

- Applied all pending migrations, including the My Snap tables, to the verified production database. Verified table writes and reads in a transaction that was rolled back.
- Configured all four notification variables in Vercel Production as sensitive values. Credentials are not stored in Git.
- Deployed and promoted `dpl_5K39z47eH1VeuJrperbw3h8KGXyc` to https://thegamesnap.com. The release was exported from the Git index so the unrelated unstaged homepage-card edit was excluded.
- Changed the production Git branch from `master` to `main`. Changes remain staged locally and must be committed/pushed so Git matches this direct deployment.
- Verified the live My Snap page, manifest, service worker, offline-reader shell, and article text endpoint. Signed-out account APIs return 401 as expected.
- Verified the 15-minute team-alert cron is registered and enabled. Its authenticated check returned `200` with zero sent and zero failed; an unauthenticated call returned 401. There were no registered devices, so no notification was sent to a person.
- Real-device notification receipt and a signed-in cross-device reading-list test still require a reader to sign in and enable alerts. Native APNs/FCM delivery and App Store submission are not included.

## Implemented

- Signed-in readers store up to 200 bookmarks in Postgres. Every read/write uses the current Clerk account; caller-supplied user IDs are ignored. Mutations check the request origin and are rate limited. Account responses are not cached.
- Guest saves stay local. Import is explicit, removes only successfully imported items, and can resume after a failure. Account changes never automatically merge another person's device saves.
- Up to 50 text-only downloads per browser. Download storage is independent of the bookmark list: removing a bookmark does not remove its download. Use the offline library to remove downloads. Downloads remain on a shared device after sign-out; they contain public article text only.
- A standalone reader works without Next.js, Clerk, or a network connection after the first download. Its service worker caches only two public reader files. No account responses, Studio data, or authenticated HTML are cached.
- Optional Web Push team alerts. A signed-in reader chooses a team and explicitly enables notifications per browser. Devices can be stopped from My Snap. Changing the favorite team does not silently change an existing alert subscription; use Enable / update this device.
- Delivery checks every 15 minutes and sends only the latest dated article for each selected team since that device's last check. This is a latest-story alert, not a notification for every article. Up to 100 devices per run; larger audiences need a queue or higher throughput.
- Expired push subscriptions are removed. Per-device leases prevent overlapping cron runs. Network failures retry next run; a provider accepting a push then timing out can cause a duplicate. Browser notification tags collapse repeated team alerts.

## Before deploying

1. Apply migration `20260929220000_my_snap_reading_and_push` using the normal database deployment workflow (`npm run db:deploy` with the intended database credentials). It only adds tables and indexes. Do not run `prisma migrate dev` against production.
2. Configure server-side `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (a real contact mailto address or your HTTPS website URL), and a strong random `CRON_SECRET` in Vercel. Generate the key pair once using `web-push.generateVAPIDKeys()` in a trusted terminal; keep the private key out of Git. The public key is delivered through an authenticated configuration route, so it does not need a NEXT_PUBLIC prefix.
3. Ensure the hosting plan supports the 15-minute cron in `vercel.json`. The cron endpoint rejects calls without the configured bearer secret. Leaving credentials absent disables signup and delivery.
4. Deploy and test a real signed-in account on two devices, bookmark deletion, import, and switching accounts. Tests mock account/database dependencies; they do not prove the production database is connected.
5. Enable alerts on a test device, publish a real team-tagged story with a current `date` (fallback `publishedAt`, then `_createdAt`), and confirm delivery and opt-out. No test pushes are sent automatically by this implementation.
6. Download an article online, then disconnect, open `/offline-reader.html`, and confirm reading/removal. Browser storage eviction removes downloads; they are not permanent backups.

## Platform scope

This implements Web Push, not native APNs/FCM device notifications. On iPhone/iPad, Web Push requires a supported version and adding the site to the Home Screen. Native Capacitor apps display an unavailable message until native push registration, Apple entitlements, signing, and delivery credentials are added. Native offline storage also needs real-device verification. No App Store submission is included.

References: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ and https://github.com/web-push-libs/web-push.

## Reader maintenance

Increment `SHELL` in `public/snap-sw.js` whenever changing the offline shell. The stored article format lives in `snap-reading-v1`; migrate it explicitly if its shape changes. The reader inserts article text with `textContent`, never as HTML.
