# YouTube Video Embed Feature

## Overview
The headline articles now support embedded YouTube videos that replace the "Stay in the Loop" newsletter sidebar and "Explore Topics" sections.

## How to Add YouTube Videos to Articles

### 1. In Sanity Studio
1. Open your Sanity Studio (typically at `/studio`)
2. Edit or create a headline article
3. Find the **YouTube Video ID** field
4. Enter the 11-character YouTube video ID (e.g., `dQw4w9WgXcQ`)
5. Optionally, add a custom **Video Title** for the embed
6. Save and publish the article

### 2. Finding YouTube Video IDs
From a YouTube URL like: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- The video ID is: `dQw4w9WgXcQ` (the part after `v=`)

From a YouTube short URL like: `https://youtu.be/dQw4w9WgXcQ`
- The video ID is: `dQw4w9WgXcQ` (the part after the domain)

### 3. How It Works
- **With Video**: When a headline has a YouTube video ID, the video player replaces the newsletter sidebar and explore topics sections
- **Without Video**: Falls back to showing the newsletter signup sidebar as before
- **Responsive**: Video player is fully responsive and works on all devices
- **Error Handling**: If a video fails to load, shows an error message with a link to watch on YouTube

### 4. Features
- ✅ Auto-sized responsive video player
- ✅ Loading states and error handling  
- ✅ Direct link to watch on YouTube
- ✅ Clean, modern design matching your site theme
- ✅ Optional custom video titles
- ✅ Automatic fallback to newsletter if no video

### 5. Example Usage
```typescript
// In your Sanity headline document:
{
  youtubeVideoId: "dQw4w9WgXcQ",
  videoTitle: "NFL Draft Analysis: Top Quarterback Prospects"
}
```

The video will automatically appear in the sidebar of the headline article page, replacing the newsletter signup and explore topics sections.
