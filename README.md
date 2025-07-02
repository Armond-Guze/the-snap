# The Snap 🏈

A modern NFL news and analysis platform built with Next.js, featuring real-time game schedules, power rankings, standings, and comprehensive NFL coverage.

> **⚠️ PRIVATE PROJECT**: This is a proprietary codebase. All code, designs, concepts, and implementations are confidential and protected by intellectual property rights. Unauthorized copying, distribution, or replication of this project or its features is strictly prohibited.

## ✨ Features

- **Game Schedule Carousel** - Interactive, mobile-friendly game schedule with Bleacher Report-style design
- **Power Rankings** - Dynamic NFL team power rankings with automated calculations
- **Live Standings** - Real-time NFL division standings and playoff implications
- **News & Headlines** - Latest NFL news with rich content management
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Modern UI** - Dark theme with custom gradients and smooth animations

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Content Management**: [Sanity CMS](https://www.sanity.io/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms**: [Formspree](https://formspree.io/)
- **Deployment**: [Vercel](https://vercel.com/)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd the-snap
```

2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```
Add your Sanity project configuration and other required environment variables.

4. Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
the-snap/
├── app/                    # Next.js app directory
│   ├── components/         # Reusable React components
│   ├── globals.css         # Global styles and custom CSS
│   └── page.tsx           # Homepage and route pages
├── sanity/                # Sanity CMS configuration
│   ├── schemaTypes/       # Content schemas
│   └── lib/              # Sanity client and utilities
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## 🎨 Key Components

- **GameSchedule** - Horizontal scrolling carousel for NFL games
- **Headlines** - Featured news articles with rich media
- **BentoGrid** - Modern grid layout for content sections
- **PowerRankings** - Interactive team rankings display
- **Standings** - Division standings with playoff implications

## 📱 Responsive Design

The application is fully responsive with:
- Desktop: Horizontal scrolling carousel
- Tablet: Optimized layout with touch support
- Mobile: Compact 2-game carousel with swipe gestures

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to [Vercel](https://vercel.com/)
2. Configure environment variables
3. Deploy automatically on every push

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

**Access is restricted to authorized collaborators only.**

For authorized contributors:
1. Contact the project owner for access permissions
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request for review

**Code Confidentiality**: All contributors must respect the proprietary nature of this codebase and maintain strict confidentiality.

## 📄 License & Legal

**This project is private and proprietary.**

- All rights reserved
- No part of this code may be reproduced, distributed, or transmitted without explicit written permission
- The design patterns, user interface concepts, and business logic are proprietary intellectual property
- Unauthorized use, copying, or distribution may result in legal action

## 🔒 Confidentiality Notice

This repository contains confidential and proprietary information. By accessing this code, you agree to:
- Keep all code, concepts, and implementations confidential
- Not reproduce, copy, or distribute any part of this project
- Not use any concepts, designs, or implementations in other projects
- Immediately report any unauthorized access or security concerns

---

**© 2025 The Snap. All rights reserved.**
Built with ❤️ for NFL fans everywhere
