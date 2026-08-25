import { requireSession, nomeDoUsuario } from '@/lib/auth'
import ConfiguracoesClient from '@/components/ConfiguracoesClient'

export default async function ConfiguracoesPage() {
  const { user } = await requireSession()

  return (
    <ConfiguracoesClient
      userId={user.id}
      email={user.email ?? ''}
      initialName={nomeDoUsuario(user)}
    />
  )
}
