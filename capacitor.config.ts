import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAP_SERVER_URL ?? 'https://thegamesnap.com';

const config: CapacitorConfig = {
  appId: 'com.mondi.thesnap',
  appName: 'THE SNAP',
  webDir: 'www',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
  },
};

export default config;
