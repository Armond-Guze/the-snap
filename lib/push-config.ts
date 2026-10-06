import "server-only";
export function pushConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  return publicKey && privateKey && subject && process.env.CRON_SECRET
    ? { publicKey, privateKey, subject }
    : null;
}
