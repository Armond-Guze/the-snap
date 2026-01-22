# The Snap 🏈

**A premium NFL news, analysis, and rankings platform built for the modern sports fan**

## 🎯 Project Vision & Mission

The Snap is an elite NFL content platform designed to compete with major sports media outlets like ESPN, Bleacher Report, and The Athletic. Our mission is to provide the most engaging, accurate, and visually stunning NFL content experience on the web.

**Core Values:**
- **Premium User Experience** - Every interaction should feel smooth, professional, and engaging
- **Content Flexibility** - Unified design system that works for news, rankings, analysis, and multimedia
- **Mobile-First** - Optimized for the way modern sports fans consume content
- **Professional Design** - Clean, modern aesthetic that builds trust and authority

## 🏗️ Current Architecture & Tech Stack

### **Frontend Framework**
- **Next.js 15** with App Router (latest stable)
- **TypeScript** for type safety and developer experience
- **Tailwind CSS 4** for styling and responsive design
- **React 18** with modern hooks and patterns

### **Content Management System**
- **Sanity CMS** - Headless CMS for flexible content management
- **Portable Text** - Rich text editing with custom components
- **Image Optimization** - Automatic image processing and CDN delivery
- **Real-time Preview** - Live content updates for editors

### **Key Integrations**
- **ESPN API** - Live NFL game data, scores, and standings
- **SportsDataIO** - Paid NFL data feed powering standings and schedule automation
- **Vercel Cron + Revalidation** - Automated cache warmers for standings data
- **YouTube Embeds** - Video content integration
- **Twitter/X Embeds** - Social media content embedding
- **Google Analytics** - User tracking and engagement metrics
- **Formspree** - Contact form handling

## 📋 Current Feature Set (Implemented)

### **🏠 Homepage**
- **Hero Section** - Featured content with dynamic backgrounds
- **Game Schedule Carousel** - Horizontal scrolling NFL games widget
- **Featured Headlines** - 2-column layout with main story + sidebar
- **More Headlines Section** - Modern vertical list of additional headline cards
- **Newsletter Signup** - Email capture with professional styling

### **📰 News & Articles System**
- **Unified Article Layout** - Professional black theme with sidebar
- **Rich Text Content** - PortableText with custom components
- **Media Embeds** - YouTube videos and Twitter posts in sidebar
- **Related Articles** - Cross-promotion between content types
- **Reading Time Calculator** - Automatic estimation based on word count
- **Author Profiles** - Bylines with avatar and bio integration
- **SEO Optimization** - Meta tags, structured data, and social sharing

### **📊 Rankings System (MAJOR RECENT UPDATE)**
- **Dual Layout Modes:**
  - **Article Mode** - Professional article layout matching news articles
  - **Power Rankings Mode** - Traditional sports rankings display
- **Dynamic Team Cards** - Custom styling with team colors and logos
- **Movement Tracking** - Up/down indicators with previous rankings
- **Rich Analysis** - PortableText content for detailed team breakdowns
- **Team Statistics** - Custom stats display for each ranking entry
- **Methodology Sections** - Transparent ranking criteria explanation

### **🏆 Standings & Schedules**
- **Live NFL Standings** - Real-time division standings
- **Game Schedule Display** - Upcoming and completed games
- **Playoff Implications** - Contextual information about standings impact

### **📱 Mobile Experience**
- **Responsive Design** - Optimized for all screen sizes
- **Touch Interactions** - Swipe gestures and mobile-friendly controls
- **Fast Loading** - Optimized images and lazy loading
- **Progressive Web App** features ready for implementation

## 🎨 Design System & Brand Identity

### **Visual Language**
- **Color Scheme** - Deep black backgrounds with white text for premium feel
- **Typography** - Modern, readable fonts with clear hierarchy
- **Spacing** - Generous whitespace for clean, uncluttered layouts
- **Animations** - Subtle transitions and hover effects
- **NFL Team Integration** - Dynamic team colors and branding

### **Component Library**
- **Headlines Component** - Reusable article display with thumbnail grid
- **Game Schedule** - Interactive carousel with team logos and scores
- **Ranking Cards** - Flexible team ranking display with analysis
- **Navigation** - Responsive header with mobile menu
- **Footer** - Comprehensive site links and social media

## 🔧 Recent Major Development (December 2024)

### **Rankings System Unification**
**Problem Solved:** Previously, ranking articles looked different from news articles, creating inconsistent user experience.

**Solution Implemented:**
- **Unified Article Layout** - Rankings now use the same professional layout as news articles
- **Schema Enhancement** - Added `showAsArticle`, `youtubeVideoId`, `twitterUrl` fields to rankings
- **Component Integration** - Full integration of YouTube embeds, Twitter embeds, related articles
- **Dynamic Team Colors** - Fixed hardcoded purple colors to use actual team hex codes
- **Type Safety** - Updated TypeScript interfaces for all new features

**Technical Details:**
- Modified `/app/rankings/[slug]/page.tsx` to support dual layout modes
- Enhanced Sanity schema in `/sanity/schemaTypes/rankings.ts`
- Updated TypeScript types in `/types/index.ts`
- Integrated all headline article components (Breadcrumb, SocialShare, ArticleViewTracker, etc.)

## � Future Development Roadmap

### **Phase 1: Content Expansion (Q1 2025)**
- **Player Profiles** - Individual player pages with stats and analysis
- **Team Pages** - Dedicated team sections with roster, schedule, news
- **Fantasy Football** - Rankings and analysis for fantasy players
- **Draft Coverage** - Mock drafts, prospect analysis, draft tracker

### **Phase 2: Community Features (Q2 2025)**
- **User Comments** - Moderated discussion system
- **User Accounts** - Personalized content and preferences
- **Social Sharing** - Enhanced sharing with custom graphics
- **Newsletter System** - Segmented email campaigns

### **Phase 3: Advanced Analytics (Q3 2025)**
- **Real-time Data** - Live game tracking and updates
- **Advanced Statistics** - Deep-dive analytics and visualizations
- **Prediction Engine** - Game predictions and analysis
- **API Development** - Public API for data access

### **Phase 4: Monetization (Q4 2025)**
- **Premium Subscriptions** - Exclusive content and features
- **Advertising Integration** - Strategic ad placements
- **Affiliate Marketing** - Product recommendations and reviews
- **Merchandise** - Branded content and products

## 🛠️ Development Guidelines & Best Practices

### **Code Standards**
- **TypeScript First** - All new code must be properly typed
- **Component Composition** - Reusable, single-purpose components
- **Mobile-First** - Design for mobile, enhance for desktop
- **Performance** - Optimize images, lazy load content, minimize bundle size
- **SEO** - Every page must have proper meta tags and structured data

### **Content Management**
- **Sanity CMS** - All content goes through Sanity for consistency
- **Image Optimization** - Use Sanity's image pipeline for automatic optimization
- **Content Types** - Maintain clear separation between headlines, rankings, pages
- **Rich Text** - Use PortableText for all long-form content with custom components

### **Key Technical Decisions**
- **App Router** - Next.js 15 App Router for modern routing and layouts
- **Server Components** - Use RSC for data fetching and SEO
- **Client Components** - Minimal client-side JavaScript for interactivity
- **Tailwind CSS** - Utility-first CSS for rapid development and consistency

## 📁 Critical File Structure

```
the-snap/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── Headlines.tsx    # Article grid display with sidebar
│   │   ├── GameSchedule.tsx # NFL games carousel
│   │   ├── RelatedArticles.tsx # Cross-content promotion
│   │   ├── YouTubeEmbed.tsx # Video integration
│   │   └── TwitterEmbed.tsx # Social media integration
│   ├── headlines/[slug]/    # News article pages
│   ├── rankings/[slug]/     # Rankings pages (UNIFIED LAYOUT)
│   ├── api/analytics/       # Custom analytics endpoints
│   └── globals.css         # Global styles and theme
├── sanity/
│   ├── schemaTypes/
│   │   ├── headline.ts     # News article schema
│   │   ├── rankings.ts     # Rankings schema (ENHANCED)
│   │   └── author.ts       # Author profiles
│   └── lib/
│       ├── queries.ts      # Sanity GROQ queries
│       └── client.ts       # Sanity client configuration
├── types/
│   └── index.ts           # TypeScript definitions (UPDATED)
└── lib/
    ├── seo.ts             # SEO metadata generation
    ├── reading-time.ts    # Content analysis utilities
    └── date-utils.ts      # Date formatting helpers
```

## 🔍 Key Integration Points

### **Sanity CMS Setup**
- **Project ID:** [Your Sanity project ID]
- **Dataset:** production
- **API Version:** 2023-12-12
- **Schema Types:** headlines, rankings, authors, categories

### **External APIs**
- **ESPN API** - Game schedules and standings
- **Sanity CDN** - Image optimization and delivery
- **Formspree** - Contact form processing

### **Environment Variables Required**
Copy `.env.example` to `.env.local` and fill in the values that apply to your deployment.

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_token
NEXT_PUBLIC_FORMSPREE_ID=your_formspree_id
SITE_URL=https://thegamesnap.com
SANITY_WEBHOOK_SECRET=change-me
REVALIDATE_SECRET=change-me

# SportsDataIO automation
SPORTSDATA_API_KEY=your_paid_key
NFL_SEASON=2024
NFL_SYNC_MODE=in-season
```

## 🚨 Important Notes for Future Development

### **Rankings System Special Considerations**
- **Dual Layout Support** - Always check `showAsArticle` boolean for layout mode
- **Team Colors** - Use `style={{ backgroundColor: team.teamColor }}` not Tailwind classes
- **Media Embeds** - YouTube takes priority over Twitter in sidebar
- **Related Content** - Mix rankings and headlines in sidebar for cross-promotion

### **Content Strategy**
- **Professional Tone** - All content should match ESPN/Athletic quality standards
- **SEO Focus** - Every piece of content needs proper meta tags and structured data
- **Mobile Experience** - Touch interactions and responsive design are critical
- **Loading Performance** - Image optimization and lazy loading are mandatory

### **Technical Debt & Known Issues**
- Analytics system is currently console logging (needs database integration)
- Some legacy components may need TypeScript updates
- Image optimization could be further enhanced
- Consider implementing Edge Runtime for better performance

## � Auto-post new articles to X (Twitter)

This project can automatically post a tweet when a new Headline is published in Sanity. Tweets rotate through a few templates so the feed doesn't look repetitive.

### Setup

1) Add credentials to `.env.local` (see `.env.example`):

```
SITE_URL=https://thegamesnap.com
SANITY_WEBHOOK_SECRET=your-strong-secret

# Either bearer token OR 4-legged OAuth keys (preferred)
X_API_KEY=...
X_API_SECRET=...
X_ACCESS_TOKEN=...
X_ACCESS_SECRET=...
```

2) In Sanity, create a webhook (Project Settings → API → Webhooks):

- Trigger on: Published events
- Document type: `headline`
- URL: `https://<your-host>/api/social/new-article?secret=YOUR_SECRET`
- Method: POST
- JSON body: default (includes document ids)

3) Local testing (optional):

```
curl -X POST "http://localhost:3000/api/social/new-article?secret=YOUR_SECRET" \
   -H "Content-Type: application/json" \
   -d '{"id":"<sanity-doc-id>"}'
```

If X credentials are not configured, the endpoint runs in dry‑run mode and simply returns the tweet text it would have posted.

## ♻️ Manual Cache Revalidation

Use the shared endpoint to force ISR revalidation or warm SportsDataIO data:

```bash
curl -X POST "https://your-site.com/api/revalidate?tag=standings&secret=REVALIDATE_SECRET"
```

- Accepts multiple `tag` or `path` query params as well as JSON bodies, e.g. `{"tags":["standings","rankings"],"paths":["/","/articles/power-rankings"]}`.
- Authenticates via `REVALIDATE_SECRET` (falls back to `SANITY_WEBHOOK_SECRET`).
- When the `standings` tag is included the route calls `fetchNFLStandingsWithFallback()` immediately, so you’ll see the SportsDataIO logging without waiting for a page view.
- If the request comes from Vercel Cron (`x-vercel-cron` header) the route trusts it automatically—manual requests must still provide the secret.

### Automated Cron Refresh

`vercel.json` ships with a cron entry that calls `/api/revalidate?tag=standings` every 30 minutes. Once deployed to Vercel this keeps standings fresh even if nobody loads the page. Adjust the schedule or add more entries (e.g., for schedules) as traffic grows.

### Customizing the tweet

Edit `lib/twitter.ts` to add/remove templates. The utility automatically truncates to 280 characters and will include up to 2 tags as hashtags.

## �🔒 Confidentiality & IP Protection

**⚠️ CRITICAL: This is proprietary technology**

This codebase represents significant intellectual property including:
- **Unique Design Patterns** - Custom component architecture and styling
- **Business Logic** - Ranking algorithms and content management workflows  
- **User Experience Innovations** - Unified article layout system and mobile optimizations
- **Integration Strategies** - Sanity CMS customizations and API implementations

**All code, designs, concepts, and implementations are confidential and protected.**

---

## 🚀 Getting Started for New Developers

1. **Environment Setup**
   ```bash
   git clone [repository]
   cd the-snap
   npm install
   cp .env.example .env.local
   npm run dev
   ```

2. **Sanity Studio Access**
   ```bash
   cd sanity
   npm run dev
   ```

3. **Key Understanding Points**
   - Rankings can display as articles or traditional power rankings
   - All content flows through Sanity CMS
   - Mobile-first responsive design is non-negotiable
   - TypeScript is required for all new code

4. **First Tasks for New Developers**
   - Review the unified rankings system implementation
   - Understand the Headlines component architecture  
   - Familiarize yourself with Sanity schema structure
   - Test mobile experience on actual devices

**Built with ❤️ for NFL fans who demand the best**

---

### 🔄 New Navbar & Profile Placeholder (2025-08)

The header has been upgraded:

* Left hamburger opens an off‑canvas mega menu with configurable feature boxes.
* Configuration lives in `app/components/navConfig.ts` – add objects to extend links.
* Centered logo widened to 150px target width.
* Right side now includes persistent `SmartSearch` (desktop + inside panel on mobile) and a `ProfileMenu` placeholder.
* `ProfileMenu` stores a lightweight local profile (favorite team) in `localStorage`; no external auth yet. Selecting a team updates the label; later this can swap the avatar or appear inline.
* Provide a square placeholder avatar image at `public/images/avatar-placeholder.png` (not included by default).
* Focus trapping + ESC support inside the mega menu for accessibility.

Future steps: integrate real authentication (e.g., NextAuth) and persist favorite team to Sanity or a user DB, then surface chosen team’s logo in the navbar.
