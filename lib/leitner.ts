const INTERVALS_DAYS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 15,
}

export function advanceBox(currentBox: number, acertou: boolean): { box: number; proxRevisao: Date } {
  const box = acertou ? Math.min(5, currentBox + 1) : 1
  const days = INTERVALS_DAYS[box]
  const proxRevisao = new Date()
  if (acertou) {
    proxRevisao.setDate(proxRevisao.getDate() + days)
  }
  return { box, proxRevisao }
}

export function isDue(proxRevisao: string): boolean {
  return new Date(proxRevisao) <= new Date()
}
