/**
 * Parâmetros de SLA — configuráveis (seção 6.3 / aba CONFIG).
 *
 * O discovery é explícito: estes limites NÃO devem ser fixos no código, mas
 * expostos em configuração (tela de configuração no futuro). Aqui definimos os
 * valores-padrão de produção, derivados da régua exata da seção 5.5.
 *
 * Modelo de faixas por grupo:
 *   dias <= noPrazo                         -> "No prazo"
 *   noPrazo < dias <= acompanhamento        -> "Em acompanhamento"
 *   acompanhamento < dias <= risco          -> "Em risco"
 *   dias > risco                            -> "Estourado"
 *
 * Quando um grupo não tem faixa de "acompanhamento" (Protocolo e Complementar),
 * acompanhamento = noPrazo, colapsando a faixa.
 */

import type { GrupoSla } from "./types";

export interface FaixaSla {
  noPrazo: number;
  acompanhamento: number;
  risco: number;
}

export interface SlaConfig {
  faixas: Record<Exclude<GrupoSla, "aquisicao">, FaixaSla>;
  /** Faixas de atualização do cliente (seção 5.6). */
  atualizacao: {
    /** Até aqui = controle interno (SLA_ATT_INTERNO). */
    interno: number;
    /** Até aqui = atualizar cliente hoje (SLA_ATT_CLIENTE). Acima = vencida. */
    cliente: number;
  };
}

/**
 * Régua de produção (seção 5.5):
 *
 * | Classificação        | No prazo | Acompanhamento | Em risco | Estourado |
 * | Protocolo (Urb/Amb)  | ≤ 5      | —              | ≤ 7      | > 7       |
 * | Licença (Urb/Amb)    | ≤ 35     | 36–50          | 51–60    | > 60      |
 * | CUOS / Inexig.       | ≤ 7      | 8–15           | 16–30    | > 30      |
 * | Habite-se            | ≤ 30     | 31–45          | 46–60    | > 60      |
 * | Complementares       | ≤ 2      | —              | 3–5      | > 5       |
 */
export const DEFAULT_SLA_CONFIG: SlaConfig = {
  faixas: {
    protocolo: { noPrazo: 5, acompanhamento: 5, risco: 7 },
    licenca: { noPrazo: 35, acompanhamento: 50, risco: 60 },
    viabilidade: { noPrazo: 7, acompanhamento: 15, risco: 30 },
    "habite-se": { noPrazo: 30, acompanhamento: 45, risco: 60 },
    complementar: { noPrazo: 2, acompanhamento: 2, risco: 5 },
  },
  atualizacao: {
    interno: 3, // SLA_ATT_INTERNO
    cliente: 5, // SLA_ATT_CLIENTE
  },
};

/** Pesos do score de prioridade por ofensor (seção 5.7). */
export const SCORE_PESO_OFENSOR = {
  BS: 1000,
  Órgão: 500,
  "Serv. Compl.": 400,
  Cliente: 300,
} as const;

/** Bônus do score por situação de atualização (seção 5.7). */
export const SCORE_BONUS = {
  atualizacaoVencida: 300,
  atualizacaoClientePendente: 100,
} as const;
