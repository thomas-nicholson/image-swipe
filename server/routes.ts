import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePrompts } from "./prompts";
import { fal } from "@fal-ai/client";
import { z } from "zod";
import { randomUUID } from "crypto";
import { objectStorageClient, ObjectStorageService } from "./replit_integrations/object_storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

fal.config({
  credentials: process.env.FAL_KEY,
});

const BATCH_SIZE = 2;
const MAX_IMAGES = 50;

const swipeSchema = z.object({
  liked: z.boolean(),
});

const objectStorageService = new ObjectStorageService();

async function uploadImageToStorage(imageBuffer: Buffer, filename: string): Promise<string> {
  let privateDir = objectStorageService.getPrivateObjectDir();
  if (!privateDir.startsWith("/")) {
    privateDir = `/${privateDir}`;
  }
  const fullPath = `${privateDir}/uploads/${filename}`;

  const parts = fullPath.split("/").filter(Boolean);
  const bucketName = parts[0];
  const objectName = parts.slice(1).join("/");

  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);

  await file.save(imageBuffer, {
    contentType: "image/jpeg",
    resumable: false,
  });

  return `/objects/uploads/${filename}`;
}

async function downloadAndStoreImage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = `${randomUUID()}.jpg`;
  return uploadImageToStorage(buffer, filename);
}

async function generateImage(prompt: string): Promise<string> {
  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt,
      image_size: "square",
      num_images: 1,
      num_inference_steps: 4,
    },
  });

  const data = result.data as any;
  if (data?.images?.[0]?.url) {
    const storedUrl = await downloadAndStoreImage(data.images[0].url);
    return storedUrl;
  }
  throw new Error("No image URL in FAL response");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  registerObjectStorageRoutes(app);

  app.get("/api/images/pending", async (_req, res) => {
    try {
      const images = await storage.getPendingImages();
      res.json(images);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/images/liked", async (_req, res) => {
    try {
      const images = await storage.getLikedImages();
      res.json(images);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/images/count", async (_req, res) => {
    try {
      const count = await storage.getTotalImageCount();
      res.json({ count, limit: MAX_IMAGES, canGenerate: count < MAX_IMAGES });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/images/generate", async (_req, res) => {
    try {
      const currentCount = await storage.getTotalImageCount();
      if (currentCount >= MAX_IMAGES) {
        return res.status(403).json({
          error: "Image generation limit reached",
          message: `Maximum of ${MAX_IMAGES} images has been reached to conserve API credits.`,
          count: currentCount,
          limit: MAX_IMAGES,
        });
      }

      const remaining = MAX_IMAGES - currentCount;
      const batchSize = Math.min(BATCH_SIZE, remaining);

      const prompts = generatePrompts(batchSize);
      const results = await Promise.allSettled(
        prompts.map(async (prompt) => {
          const imageUrl = await generateImage(prompt);
          return storage.createImage({
            imageUrl,
            prompt,
            model: "fal-ai/flux/schnell",
          });
        })
      );

      const created = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilled<any>).value);

      if (created.length === 0) {
        const errors = results
          .filter((r) => r.status === "rejected")
          .map((r) => (r as PromiseRejectedResult).reason?.message);
        return res.status(500).json({ error: "All image generations failed", details: errors });
      }

      res.json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/images/:id/swipe", async (req, res) => {
    try {
      const { id } = req.params;
      const parsed = swipeSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }

      const image = await storage.swipeImage(id, parsed.data.liked);
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      res.json(image);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

type PromiseFulfilled<T> = { status: "fulfilled"; value: T };
