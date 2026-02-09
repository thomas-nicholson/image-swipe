import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import { Heart, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Image } from "@shared/schema";

const SWIPE_THRESHOLD = 100;

function SwipeCard({
  image,
  onSwipe,
  isTop,
}: {
  image: Image;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe("right");
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe("left");
    }
  };

  return (
    <motion.div
      data-testid={`swipe-card-${image.id}`}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: isTop ? 10 : 5,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale: isTop ? 1 : 0.95,
        opacity: isTop ? 1 : 0.7,
        y: isTop ? 0 : 12,
      }}
      exit={{
        x: x.get() > 0 ? 400 : -400,
        opacity: 0,
        rotate: x.get() > 0 ? 20 : -20,
        transition: { duration: 0.3 },
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="relative w-full h-full rounded-md overflow-hidden bg-card border border-card-border">
        <img
          src={image.imageUrl}
          alt={image.prompt}
          className="w-full h-full object-cover"
          loading="eager"
          draggable={false}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {isTop && (
          <>
            <motion.div
              data-testid="like-indicator"
              className="absolute top-6 left-6 border-4 border-green-500 rounded-md px-4 py-2 rotate-[-15deg]"
              style={{ opacity: likeOpacity }}
            >
              <span className="text-green-500 text-3xl font-black tracking-wide">LIKE</span>
            </motion.div>

            <motion.div
              data-testid="nope-indicator"
              className="absolute top-6 right-6 border-4 border-red-500 rounded-md px-4 py-2 rotate-[15deg]"
              style={{ opacity: nopeOpacity }}
            >
              <span className="text-red-500 text-3xl font-black tracking-wide">NOPE</span>
            </motion.div>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-white/90 text-sm leading-relaxed line-clamp-2 font-medium">
            {image.prompt}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ onGenerate, isGenerating }: { onGenerate: () => void; isGenerating: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
        <Sparkles className="w-9 h-9 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-1">No images yet</h3>
        <p className="text-muted-foreground text-sm max-w-[280px]">
          Generate some AI images to start swiping through the collection
        </p>
      </div>
      <Button
        data-testid="button-generate-first"
        onClick={onGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Images
          </>
        )}
      </Button>
    </div>
  );
}

export default function SwipePage() {
  const [queue, setQueue] = useState<Image[]>([]);
  const seenIds = useRef(new Set<string>());
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    document.title = "ArtSwipe - Discover AI Art";
  }, []);

  const { data: pendingImages = [], isLoading } = useQuery<Image[]>({
    queryKey: ["/api/images/pending"],
  });

  useEffect(() => {
    const newImages = pendingImages.filter((img) => !seenIds.current.has(img.id));
    if (newImages.length > 0) {
      newImages.forEach((img) => seenIds.current.add(img.id));
      setQueue((prev) => [...prev, ...newImages]);
    }
  }, [pendingImages]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/images/generate");
      return res.json();
    },
    onSuccess: () => {
      isGeneratingRef.current = false;
      queryClient.invalidateQueries({ queryKey: ["/api/images/pending"] });
    },
    onError: () => {
      isGeneratingRef.current = false;
    },
  });

  const swipeMutation = useMutation({
    mutationFn: async ({ imageId, liked }: { imageId: string; liked: boolean }) => {
      const res = await apiRequest("POST", `/api/images/${imageId}/swipe`, { liked });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images/liked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  useEffect(() => {
    if (queue.length <= 1 && !isGeneratingRef.current && !generateMutation.isPending && !isLoading) {
      isGeneratingRef.current = true;
      generateMutation.mutate();
    }
  }, [queue.length, isLoading]);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      const currentImage = queue[0];
      if (!currentImage) return;

      setQueue((prev) => prev.slice(1));

      swipeMutation.mutate({
        imageId: currentImage.id,
        liked: direction === "right",
      });
    },
    [queue, swipeMutation]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
        <Skeleton className="w-full max-w-sm aspect-[3/4] rounded-md" />
        <div className="flex gap-6">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    );
  }

  if (queue.length === 0 && pendingImages.length === 0) {
    return (
      <EmptyState
        onGenerate={() => generateMutation.mutate()}
        isGenerating={generateMutation.isPending}
      />
    );
  }

  const visibleCards = queue.slice(0, 2);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      <div className="relative w-full max-w-sm aspect-[3/4]">
        <AnimatePresence mode="popLayout">
          {visibleCards
            .slice(0, 2)
            .reverse()
            .map((image) => {
              const actualIsTop = image.id === visibleCards[0]?.id;
              return (
                <SwipeCard
                  key={image.id}
                  image={image}
                  onSwipe={handleSwipe}
                  isTop={actualIsTop}
                />
              );
            })}
        </AnimatePresence>

        {generateMutation.isPending && queue.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/50 rounded-md backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Generating images...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-8">
        <button
          data-testid="button-dislike"
          className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-destructive/30 text-destructive transition-colors disabled:opacity-40"
          onClick={() => handleSwipe("left")}
          disabled={!visibleCards[0]}
        >
          <X className="w-7 h-7" />
        </button>

        <button
          data-testid="button-like"
          className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-green-500/30 text-green-500 transition-colors disabled:opacity-40"
          onClick={() => handleSwipe("right")}
          disabled={!visibleCards[0]}
        >
          <Heart className="w-7 h-7" />
        </button>
      </div>

      <Button
        data-testid="button-generate-more"
        variant="ghost"
        size="sm"
        onClick={() => {
          if (!isGeneratingRef.current) {
            isGeneratingRef.current = true;
            generateMutation.mutate();
          }
        }}
        disabled={generateMutation.isPending}
        className="text-muted-foreground"
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3" />
            Generate more
          </>
        )}
      </Button>
    </div>
  );
}
