/**
 * Score de prioridade do site — seção 5.7.
 *
 * Fórmula de produção (do discovery):
 *   score = (pesoOfensor + bônusAtualização + diasDoServicoMaisCritico)
 *           × quantidadeDeServicosAtivos
 *
 * Pesos do ofensor: BS 1000 > Órgão 500 > Serv. Compl. 400 > Cliente 300.
 * Bônus: atualização vencida (+300) ou atualização do cliente pendente (+100).
 * Efeito prático: priorizar sites com pendência interna (BS), muitos serviços
 * e muito tempo parados.
 */

import { SCORE_BONUS, SCORE_PESO_OFENSOR } from "./config";
import type { Ofensor, StatusAtualizacao } from "./types";

export interface EntradaScore {
  ofensorPrincipal: Ofensor | null;
  statusAtualizacao: StatusAtualizacao;
  diasServicoMaisCritico: number;
  qtdServicosAtivos: number;
}

export function calcularScore(e: EntradaScore): number {
  if (e.qtdServicosAtivos <= 0) return 0;

  const pesoOfensor = e.ofensorPrincipal ? SCORE_PESO_OFENSOR[e.ofensorPrincipal] : 0;

  let bonus = 0;
  if (e.statusAtualizacao === "Vencida") bonus = SCORE_BONUS.atualizacaoVencida;
  else if (e.statusAtualizacao === "Atualizar hoje") bonus = SCORE_BONUS.atualizacaoClientePendente;

  const base = pesoOfensor + bonus + Math.max(0, e.diasServicoMaisCritico);
  return base * e.qtdServicosAtivos;
}
