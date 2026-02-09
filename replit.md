# ArtSwipe - AI Image Tinder

## Overview
A Tinder-style swipe interface for AI-generated images. Users swipe right on images they like and left on ones they don't. Liked images are saved to a gallery. All swipe data is recorded for training purposes. Images are generated automatically using FAL AI (flux/schnell model).

## Architecture
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui components, framer-motion for swipe animations
- **Backend**: Express.js API server
- **Database**: PostgreSQL (Drizzle ORM)
- **AI**: FAL AI (fal-ai/flux/schnell) for image generation
- **Prompts**: Server-side randomized prompt generator combining subjects, styles, moods, and extras

## Key Files
- `shared/schema.ts` - Database schema (images table with id, imageUrl, prompt, model, liked, createdAt)
- `server/routes.ts` - API routes for image CRUD, generation, and swipe actions
- `server/storage.ts` - Database storage interface using Drizzle ORM
- `server/prompts.ts` - Automated prompt generation system
- `client/src/App.tsx` - App layout with bottom navigation (Discover, Saved, Stats)
- `client/src/pages/swipe.tsx` - Tinder-style swipe card interface
- `client/src/pages/saved.tsx` - Gallery of liked images
- `client/src/pages/stats.tsx` - Swipe statistics dashboard

## API Routes
- `GET /api/images/pending` - Get unswiped images
- `GET /api/images/liked` - Get liked images
- `GET /api/stats` - Get swipe statistics
- `POST /api/images/generate` - Generate batch of 3 AI images
- `POST /api/images/:id/swipe` - Record like/dislike on an image

## Environment
- `FAL_KEY` - FAL AI API key (secret)
- `DATABASE_URL` - PostgreSQL connection string
