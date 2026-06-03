/**
 * Atualização do cliente — seção 5.6.
 *
 * A "última atualização" de um site é a data mais recente (Data de Atualização
 * LPU) entre seus serviços ativos. Faixas:
 *   até `interno` dias  → controle interno
 *   até `cliente` dias  → atualizar cliente hoje
 *   acima               → vencida
 *   sem data            → sinalizar
 */

import { DEFAULT_SLA_CONFIG, type SlaConfig } from "./config";
import { diasEntre } from "./sla";
import type { ServicoCalculado, StatusAtualizacao } from "./types";

export interface ResultadoAtualizacao {
  ultimaAtualizacao: string | null;
  diasSemAtualizacao: number | null;
  status: StatusAtualizacao;
}

/** Data de atualização mais recente entre os serviços ativos. */
export function ultimaAtualizacaoAtivos(
  servicos: ReadonlyArray<ServicoCalculado>,
): string | null {
  let maior: string | null = null;
  for (const s of servicos) {
    if (!s.ativo) continue;
    const d = s.dataAtualizacaoLpu;
    if (!d) continue;
    if (maior === null || new Date(d).getTime() > new Date(maior).getTime()) {
      maior = d;
    }
  }
  return maior;
}

export function calcularAtualizacao(
  servicos: ReadonlyArray<ServicoCalculado>,
  ref: Date,
  config: SlaConfig = DEFAULT_SLA_CONFIG,
): ResultadoAtualizacao {
  const temAtivos = servicos.some((s) => s.ativo);
  const ultima = ultimaAtualizacaoAtivos(servicos);

  if (!temAtivos) {
    return { ultimaAtualizacao: null, diasSemAtualizacao: null, status: "Sem data" };
  }
  if (ultima === null) {
    return { ultimaAtualizacao: null, diasSemAtualizacao: null, status: "Sem data" };
  }

  const dias = diasEntre(ultima, ref) ?? 0;
  let status: StatusAtualizacao;
  if (dias <= config.atualizacao.interno) status = "Controle interno";
  else if (dias <= config.atualizacao.cliente) status = "Atualizar hoje";
  else status = "Vencida";

  return { ultimaAtualizacao: ultima, diasSemAtualizacao: dias, status };
}
