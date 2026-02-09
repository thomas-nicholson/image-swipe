import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Image } from "@shared/schema";

function ImageCard({ image }: { image: Image }) {
  const handleDownload = async () => {
    try {
      const response = await fetch(image.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-image-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      window.open(image.imageUrl, "_blank");
    }
  };

  return (
    <div
      data-testid={`saved-image-${image.id}`}
      className="group relative rounded-md overflow-hidden bg-card border border-card-border"
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={image.imageUrl}
          alt={image.prompt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent invisible group-hover:visible transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white/90 text-xs leading-relaxed line-clamp-3 mb-2">
            {image.prompt}
          </p>
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-none">
              {image.model.split("/").pop()}
            </Badge>
            <Button
              data-testid={`button-download-${image.id}`}
              size="icon"
              variant="ghost"
              className="text-white/80"
              onClick={handleDownload}
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-2">
        <Heart className="w-4 h-4 text-red-500 fill-red-500 drop-shadow-lg" />
      </div>
    </div>
  );
}

export default function SavedPage() {
  useEffect(() => {
    document.title = "ArtSwipe - Saved Images";
  }, []);

  const { data: likedImages = [], isLoading } = useQuery<Image[]>({
    queryKey: ["/api/images/liked"],
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-60" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (likedImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Heart className="w-9 h-9 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">No saved images</h3>
          <p className="text-muted-foreground text-sm max-w-[280px]">
            Swipe right on images you love and they'll show up here
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold" data-testid="text-saved-title">
            Saved Images
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {likedImages.length} image{likedImages.length !== 1 ? "s" : ""} you've liked
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {likedImages.map((image) => (
            <ImageCard key={image.id} image={image} />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
