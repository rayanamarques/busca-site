/**
 * Cálculo de SLA por serviço — seção 5.5.
 *
 * O SLA é calculado por serviço, a partir dos "dias em aberto"
 * (hoje − data de acionamento da LPU), e só vale para serviços ativos.
 * Cada classificação tem sua própria régua (ver config.ts).
 */

import { DEFAULT_SLA_CONFIG, type SlaConfig } from "./config";
import { grupoSlaDe } from "./normalize";
import type { Classificacao, GrupoSla, SlaStatus } from "./types";

const MS_POR_DIA = 1000 * 60 * 60 * 24;

/** Diferença em dias inteiros entre `ref` e `data` (ref − data). */
export function diasEntre(data: string | null | undefined, ref: Date): number | null {
  if (!data) return null;
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return null;
  const inicio = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const fim = Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate());
  return Math.floor((fim - inicio) / MS_POR_DIA);
}

/** Pesos de faixa e grupo para ordenar o SLA mais crítico do site (5.5). */
const PESO_FAIXA: Record<SlaStatus, number> = {
  Estourado: 4,
  "Em risco": 3,
  "Em acompanhamento": 2,
  "No prazo": 1,
  "Verificar data": 0,
  "Acionar no sistema": 0,
  "Não acionado": 0,
  "Serviço finalizado": 0,
  "Sem SLA": 0,
};

/**
 * Peso do grupo para desempate dentro da mesma faixa.
 * Ordem da seção 5.5: Protocolo > Licença > CUOS/Inexig. > Habite-se > Complementar.
 */
const PESO_GRUPO: Record<GrupoSla, number> = {
  protocolo: 5,
  licenca: 4,
  viabilidade: 3,
  "habite-se": 2,
  complementar: 1,
  aquisicao: 0,
};

/**
 * Classifica o status de SLA de um serviço.
 * `ativo` indica se o serviço está em situação ativa (só então há SLA real).
 */
export function calcularSlaStatus(
  classificacao: Classificacao,
  diasEmAberto: number | null,
  ativo: boolean,
  config: SlaConfig = DEFAULT_SLA_CONFIG,
): SlaStatus {
  const grupo = grupoSlaDe(classificacao);

  // Aquisição não tem SLA.
  if (grupo === "aquisicao") return "Sem SLA";

  // Serviço não-ativo: não tem SLA de andamento.
  if (!ativo) return "Serviço finalizado";

  // Ativo mas sem data de acionamento -> precisa acionar no sistema (5.5).
  if (diasEmAberto === null) return "Acionar no sistema";

  // Data futura (inconsistência) -> verificar.
  if (diasEmAberto < 0) return "Verificar data";

  const faixa = config.faixas[grupo];
  if (diasEmAberto <= faixa.noPrazo) return "No prazo";
  if (diasEmAberto <= faixa.acompanhamento) return "Em acompanhamento";
  if (diasEmAberto <= faixa.risco) return "Em risco";
  return "Estourado";
}

/**
 * Severidade numérica do SLA, usada para escolher o "SLA mais crítico do site".
 * Maior = mais crítico. Combina faixa (peso 100) e grupo (desempate).
 */
export function severidadeSla(classificacao: Classificacao, status: SlaStatus): number {
  return PESO_FAIXA[status] * 100 + PESO_GRUPO[grupoSlaDe(classificacao)];
}
