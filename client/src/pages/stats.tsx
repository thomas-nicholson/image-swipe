import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, X, ImageIcon, TrendingUp } from "lucide-react";

import { useEffect } from "react";

interface Stats {
  liked: number;
  disliked: number;
  total: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  testId,
}: {
  icon: typeof Heart;
  label: string;
  value: number;
  color: string;
  testId: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold" data-testid={testId}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatsPage() {
  useEffect(() => {
    document.title = "ArtSwipe - Statistics";
  }, []);

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-52 mb-6" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-md" />
        ))}
      </div>
    );
  }

  const liked = stats?.liked ?? 0;
  const disliked = stats?.disliked ?? 0;
  const total = stats?.total ?? 0;
  const likeRate = total > 0 ? Math.round((liked / total) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold" data-testid="text-stats-title">
          Statistics
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your swiping activity at a glance
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Heart}
          label="Liked"
          value={liked}
          color="bg-green-500/10 text-green-500"
          testId="stat-liked"
        />
        <StatCard
          icon={X}
          label="Disliked"
          value={disliked}
          color="bg-red-500/10 text-red-500"
          testId="stat-disliked"
        />
        <StatCard
          icon={ImageIcon}
          label="Total Seen"
          value={total}
          color="bg-primary/10 text-primary"
          testId="stat-total"
        />
        <StatCard
          icon={TrendingUp}
          label="Like Rate"
          value={likeRate}
          color="bg-blue-500/10 text-blue-500"
          testId="stat-rate"
        />
      </div>

      {total > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Like Ratio</p>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-700"
                style={{ width: `${likeRate}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted-foreground">{likeRate}% liked</span>
              <span className="text-xs text-muted-foreground">{100 - likeRate}% passed</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
