
/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        hero: ['clamp(1.9rem,2.6vw+0.6rem,2.9rem)', { lineHeight: '1.1', fontWeight: '700' }],
        h2fluid: ['clamp(1.35rem,1.2vw+0.7rem,1.9rem)', { lineHeight: '1.15', fontWeight: '600' }],
        h3fluid: ['clamp(1.1rem,0.9vw+0.55rem,1.35rem)', { lineHeight: '1.2', fontWeight: '600' }],
        teaser: ['clamp(.95rem,.55vw+.6rem,1.05rem)', { lineHeight: '1.25', fontWeight: '500' }],
      },
    },
  },
  // No plugins needed currently (custom line-clamp utilities added manually)
  plugins: [],
}

export default config
