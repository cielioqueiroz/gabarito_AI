import ShellLayout from '@/components/ShellLayout'
import { StatSkeleton, ConcursoCardSkeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <ShellLayout title="Dashboard">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[0, 1, 2].map(i => <StatSkeleton key={i} />)}
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map(i => <ConcursoCardSkeleton key={i} />)}
        </div>
      </div>
    </ShellLayout>
  )
}
