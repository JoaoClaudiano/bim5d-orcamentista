export const PLANOS = {
  free: {
    id: 'free',
    nome: 'Free',
    limiteProjetos: 3,
  },
  pro: {
    id: 'pro',
    nome: 'Pro',
    limiteProjetos: Infinity,
  },
}

export function obterPlanoUsuario(user) {
  const planoMeta = user?.app_metadata?.plan || user?.user_metadata?.plan
  return planoMeta === 'pro' ? PLANOS.pro : PLANOS.free
}

export function atingiuLimiteProjetos(totalProjetos, plano) {
  if (!plano || !Number.isFinite(plano.limiteProjetos)) return false
  return totalProjetos >= plano.limiteProjetos
}
