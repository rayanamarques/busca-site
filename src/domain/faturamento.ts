/**
 * Faturamento — seção 5.4.
 *
 * - A faturar = situações "Finalizado (faturar)" + "Cancelado Faturável".
 * - Faturado = "Concluído (faturado)" com NFS-e preenchida.
 * - Em espera com PO = "Em Espera" com P.O. preenchida.
 *
 * Regras de elegibilidade por cliente/tipo (CUOS, Inexigibilidade, Complementar)
 * são aplicadas em `servicoFaturavel`.
 */

import type { Cliente, Servico, StatusFaturamento } from "./types";
import { grupoSlaDe } from "./normalize";

function preenchido(v: string | null | undefined): boolean {
  return !!v && v.trim().length > 0;
}

/** O serviço está na fila "a faturar"? (5.4) */
export function isAFaturar(situacao: Servico["situacao"]): boolean {
  return situacao === "Finalizado (faturar)" || situacao === "Cancelado Faturável";
}

/** O serviço já foi faturado? (Concluído + NFS-e) (5.4) */
export function isFaturado(servico: Pick<Servico, "situacao" | "nfse">): boolean {
  return servico.situacao === "Concluído (faturado)" && preenchido(servico.nfse);
}

/** Em espera com PO preenchida? (5.4) */
export function isEmEsperaComPo(servico: Pick<Servico, "situacao" | "po">): boolean {
  return servico.situacao === "Em Espera" && preenchido(servico.po);
}

/**
 * Elegibilidade de faturamento por cliente e tipo (5.4):
 * - CUOS: só IHS fatura à parte; TBSA/Winity/Highline vão no pacote de aquisição.
 * - Inexigibilidade: TBSA no pacote; IHS não realiza; Winity/demais faturam à parte.
 * - Complementares: fornecedor terceiro (ofensor "Serv. Compl."), faturados à parte.
 */
export function servicoFaturavel(
  classificacao: Servico["classificacao"],
  cliente: Cliente,
): boolean {
  const grupo = grupoSlaDe(classificacao);

  if (classificacao === "Viabilidade - CUOS") {
    return cliente === "IHS";
  }
  if (classificacao === "Viabilidade - Inexigibilidade") {
    if (cliente === "TBSA") return false; // vai no pacote
    if (cliente === "IHS") return false; // não realiza
    return true; // Winity/demais à parte
  }
  if (grupo === "aquisicao") return true;
  // Licenciamento e complementares são faturáveis por padrão.
  return true;
}

/**
 * Status de faturamento agregado de um site, a partir de seus serviços.
 * Prioriza o que demanda ação: A faturar > Em espera (com PO) > ...
 */
export function statusFaturamentoSite(
  servicos: ReadonlyArray<Servico>,
  cliente: Cliente,
): StatusFaturamento {
  let temAFaturar = false;
  let temEsperaComPo = false;
  let temEsperaSemPo = false;
  let temFaturado = false;

  for (const s of servicos) {
    if (!servicoFaturavel(s.classificacao, cliente)) continue;
    if (isAFaturar(s.situacao)) temAFaturar = true;
    else if (s.situacao === "Em Espera") {
      if (preenchido(s.po)) temEsperaComPo = true;
      else temEsperaSemPo = true;
    } else if (isFaturado(s)) temFaturado = true;
  }

  if (temAFaturar) return "A faturar";
  if (temEsperaComPo) return "Em espera (com PO)";
  if (temEsperaSemPo) return "Em espera (sem PO)";
  if (temFaturado) return "Faturado";
  return "Sem faturamento";
}
