import { Settings } from 'lucide-react'
import ShellLayout from '@/components/ShellLayout'

export default function ConfiguracoesPage() {
  return (
    <ShellLayout title="Configurações">
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1C1F2E] border border-[#2A2D3E] mb-5">
          <Settings size={24} className="text-[#475569]" />
        </div>
        <h2 className="font-bold text-[#F1F5F9] text-lg mb-2">Configurações</h2>
        <p className="text-[#475569] text-sm">Em breve — perfil, notificações e preferências.</p>
      </div>
    </ShellLayout>
  )
}
