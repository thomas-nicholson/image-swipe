# ArtSwipe - AI Image Tinder

## Overview
A Tinder-style swipe interface for AI-generated images. Users swipe right on images they like and left on ones they don't. Liked images are saved to a gallery. All swipe data is recorded for training purposes. Images are generated automatically using FAL AI (flux/schnell model).

## Architecture
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui components, framer-motion for swipe animations
- **Backend**: Express.js API server
- **Database**: PostgreSQL (Drizzle ORM)
- **Storage**: Replit Object Storage for persistent image storage
- **AI**: FAL AI (fal-ai/flux/schnell) for image generation (limited to 50 images total)
- **Prompts**: Server-side randomized prompt generator combining subjects, styles, moods, and extras

## Key Files
- `shared/schema.ts` - Database schema (images table with id, imageUrl, prompt, model, liked, createdAt)
- `server/routes.ts` - API routes for image CRUD, generation, and swipe actions
- `server/storage.ts` - Database storage interface using Drizzle ORM
- `server/prompts.ts` - Automated prompt generation system
- `server/replit_integrations/object_storage/` - Object storage integration for image persistence
- `client/src/App.tsx` - App layout with bottom navigation (Discover, Saved, Stats)
- `client/src/pages/swipe.tsx` - Tinder-style swipe card interface
- `client/src/pages/saved.tsx` - Gallery of liked images
- `client/src/pages/stats.tsx` - Swipe statistics dashboard

## API Routes
- `GET /api/images/pending` - Get unswiped images
- `GET /api/images/liked` - Get liked images
- `GET /api/images/count` - Get total image count vs limit (50)
- `GET /api/stats` - Get swipe statistics
- `POST /api/images/generate` - Generate batch of 2 AI images (blocked after 50 total)
- `POST /api/images/:id/swipe` - Record like/dislike on an image
- `GET /objects/uploads/:filename` - Serve images from object storage

## Image Storage Flow
1. FAL AI generates image and returns temporary URL
2. Server downloads the image buffer
3. Server uploads to Replit Object Storage (private dir/uploads/)
4. Database stores path as `/objects/uploads/<uuid>.jpg`
5. Frontend requests image via `/objects/uploads/<uuid>.jpg` route
6. Server streams image from object storage to client

## Environment
- `FAL_KEY` - FAL AI API key (secret)
- `DATABASE_URL` - PostgreSQL connection string
- `PRIVATE_OBJECT_DIR` - Object storage private directory path
- `PUBLIC_OBJECT_SEARCH_PATHS` - Object storage public search paths
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` - Object storage bucket ID
