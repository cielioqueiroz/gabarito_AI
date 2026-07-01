import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-shimmer rounded-md bg-elevated', className)} />
}

export function StatSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-8 w-12" />
    </div>
  )
}

export function ConcursoCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-14" />
          </div>
        </div>
      </div>
      <Skeleton className="h-1.5 w-full" />
      <Skeleton className="h-1.5 w-full" />
    </div>
  )
}
