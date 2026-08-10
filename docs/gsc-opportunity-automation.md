# Weekly Search Console opportunity automation

The local Codex automation **Weekly Search Console content opportunities** runs
at 10:00 a.m. Eastern every Monday. It is read-only: it ranks content refresh,
CTR, emerging-query, authority/intent, and cannibalization opportunities without
changing Sanity or repository files.

## Required local configuration

Add these values to `.env.local`:

```dotenv
GSC_SERVICE_ACCOUNT_EMAIL=service-account-name@project-id.iam.gserviceaccount.com
GSC_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GSC_PROPERTY_URI=sc-domain:thegamesnap.com
```

The service-account email must also be granted access to the
`sc-domain:thegamesnap.com` property in Search Console under **Settings → Users
and permissions**. Do not commit `.env.local` or paste the private key into a
Codex task.

The report requests only the read-only Search Console OAuth scope. It compares
completed 28-day periods and a trailing 90-day baseline, ending three days
before the run to avoid relying on provisional data.

## Verification commands

```bash
npm run seo:opportunities -- --self-test
npm run seo:opportunities -- --check-config
npm run seo:opportunities
```

The live command exits without querying Google when configuration is missing.
Search Analytics returns top rows and can omit anonymized queries, so the report
is directional rather than an exhaustive traffic ledger.

Official references:

- [Search Analytics query API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- [Search Console users and permissions](https://support.google.com/webmasters/answer/7687615)
