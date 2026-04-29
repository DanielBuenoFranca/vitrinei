// Skeletons específicos por rota, usados como fallback do React.lazy/Suspense.
import { Skeleton } from "@/components/ui/skeleton";

export function DefaultRouteSkeleton() {
  return (
    <div className="min-h-screen p-6 space-y-4">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

export function RadarSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="relative w-72 h-72">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />
        <div className="absolute inset-6 rounded-full border-2 border-primary/30 animate-pulse" />
        <div className="absolute inset-12 rounded-full border-2 border-primary/40 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CardexSkeleton() {
  return (
    <div className="p-6 space-y-3">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-6 col-span-1" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
