import Page from '@/components/Page'
import { StatSkeleton, ConcursoCardSkeleton } from '@/components/ui/skeleton'

/**
 * Fica no grupo `(dashboard)` e não em `(app)`: na raiz da área logada este
 * esqueleto de dashboard apareceria também ao abrir /configuracoes ou /revisao.
 */
export default function Loading() {
  return (
    <Page title="Dashboard">
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map(i => <StatSkeleton key={i} />)}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map(i => <ConcursoCardSkeleton key={i} />)}
      </div>
    </Page>
  )
}
