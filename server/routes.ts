import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePrompts } from "./prompts";
import { fal } from "@fal-ai/client";
import { z } from "zod";

fal.config({
  credentials: process.env.FAL_KEY,
});

const BATCH_SIZE = 3;

const swipeSchema = z.object({
  liked: z.boolean(),
});

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
    return data.images[0].url;
  }
  throw new Error("No image URL in FAL response");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

  app.post("/api/images/generate", async (_req, res) => {
    try {
      const prompts = generatePrompts(BATCH_SIZE);
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
