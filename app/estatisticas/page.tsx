import { BarChart3 } from 'lucide-react'
import ShellLayout from '@/components/ShellLayout'

export default function EstatisticasPage() {
  return (
    <ShellLayout title="Estatísticas">
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-border mb-5">
          <BarChart3 size={24} className="text-muted-foreground" />
        </div>
        <h2 className="font-bold text-foreground text-lg mb-2">Estatísticas</h2>
        <p className="text-muted-foreground text-sm">Em breve — gráficos de progresso e desempenho por disciplina.</p>
      </div>
    </ShellLayout>
  )
}
