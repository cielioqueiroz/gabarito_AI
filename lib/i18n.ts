// Central catalog of strings — keeps UI text out of components so it can be
// swapped for a real i18n runtime (next-intl, etc.) later without a rewrite.

export const t = {
  common: {
    back: 'Voltar',
    cancel: 'Cancelar',
    save: 'Salvar',
    saving: 'Salvando…',
    loading: 'Carregando…',
    retry: 'Tente novamente.',
  },
  dashboard: {
    title: 'Dashboard',
    greeting: (name: string) => `Olá, ${name} 👋`,
    empty: 'Comece adicionando seu primeiro concurso.',
    countConcursos: (n: number) => `Você tem ${n} concurso${n > 1 ? 's' : ''} cadastrado${n > 1 ? 's' : ''}.`,
    stats: { concursos: 'Concursos', topicos: 'Tópicos estudados', cards: 'Cards dominados' },
  },
  concurso: {
    novo: 'Novo concurso',
    nome: 'Nome',
    cargo: 'Cargo',
    banca: 'Banca',
    ano: 'Ano',
    edital: 'Edital (PDF ou TXT) — opcional',
  },
  auth: {
    signIn: 'Entrar',
    signUp: 'Criar conta',
    email: 'E-mail',
    password: 'Senha',
    forgotPassword: 'Esqueci minha senha',
    resetPassword: 'Redefinir senha',
    resetEmailSent: 'Verifique seu e-mail para redefinir a senha.',
    withGoogle: 'Continuar com Google',
    or: 'ou',
  },
  leitner: {
    box: { 1: 'Aprendendo', 2: 'Revisando', 3: 'Fixando', 4: 'Dominando', 5: 'Dominado' } as Record<number, string>,
  },
  errors: {
    generic: 'Ocorreu um erro. Tente novamente.',
    rateLimit: 'Muitas requisições. Aguarde alguns segundos.',
  },
}
