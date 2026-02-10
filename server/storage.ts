import { eq, isNull, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { images, type InsertImage, type Image } from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  createImage(image: InsertImage): Promise<Image>;
  getPendingImages(): Promise<Image[]>;
  getLikedImages(): Promise<Image[]>;
  swipeImage(id: string, liked: boolean): Promise<Image | undefined>;
  getStats(): Promise<{ liked: number; disliked: number; total: number }>;
  getTotalImageCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async createImage(image: InsertImage): Promise<Image> {
    const [result] = await db.insert(images).values(image).returning();
    return result;
  }

  async getPendingImages(): Promise<Image[]> {
    return db.select().from(images).where(isNull(images.liked)).orderBy(images.createdAt);
  }

  async getLikedImages(): Promise<Image[]> {
    return db.select().from(images).where(eq(images.liked, true)).orderBy(desc(images.createdAt));
  }

  async swipeImage(id: string, liked: boolean): Promise<Image | undefined> {
    const [result] = await db
      .update(images)
      .set({ liked })
      .where(eq(images.id, id))
      .returning();
    return result;
  }

  async getStats(): Promise<{ liked: number; disliked: number; total: number }> {
    const allSwiped = await db
      .select()
      .from(images)
      .where(eq(images.liked, true))
      .then((r) => r.length);

    const disliked = await db
      .select()
      .from(images)
      .where(eq(images.liked, false))
      .then((r) => r.length);

    return {
      liked: allSwiped,
      disliked,
      total: allSwiped + disliked,
    };
  }

  async getTotalImageCount(): Promise<number> {
    const all = await db.select().from(images);
    return all.length;
  }
}

export const storage = new DatabaseStorage();
