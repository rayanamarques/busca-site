/**
 * Agregação serviço → site — seção 4.1.
 *
 * "Calcular no nível do serviço e depois agregar é mais robusto do que
 * recalcular tudo no nível do site." Aqui implementamos exatamente isso:
 *   1. Para cada serviço, derivamos grupo, dias em aberto, SLA, ofensor.
 *   2. Agregamos para o site: licenciador(es), ofensor principal, SLA mais
 *      crítico, última atualização, faturamento e score de prioridade.
 */

import { DEFAULT_SLA_CONFIG, type SlaConfig } from "./config";
import { calcularAtualizacao } from "./atualizacao";
import { statusFaturamentoSite } from "./faturamento";
import { derivarLicenciador } from "./licenciador";
import {
  grupoSlaDe,
  isLicenciamentoOuViabilidade,
  isSituacaoAtiva,
} from "./normalize";
import { ofensorDoServico, ofensorPrincipal } from "./ofensor";
import { calcularScore } from "./score";
import { calcularSlaStatus, diasEntre, severidadeSla } from "./sla";
import type {
  Pessoa,
  Servico,
  ServicoCalculado,
  Site,
  SiteCalculado,
} from "./types";

/** Calcula os campos derivados de um único serviço. */
export function calcularServico(
  servico: Servico,
  ref: Date,
  config: SlaConfig = DEFAULT_SLA_CONFIG,
): ServicoCalculado {
  const grupoSla = grupoSlaDe(servico.classificacao);
  // "Ativo" para fins de site: licenciamento/viabilidade em situação ativa (5.1).
  const ativo =
    isLicenciamentoOuViabilidade(servico.classificacao) && isSituacaoAtiva(servico.situacao);

  const diasEmAberto = diasEntre(servico.dataAcionamento, ref);
  const slaStatus = calcularSlaStatus(servico.classificacao, diasEmAberto, ativo, config);
  const slaSeveridade = severidadeSla(servico.classificacao, slaStatus);
  const ofensor = ofensorDoServico(servico.classificacao, servico.situacao);

  return {
    ...servico,
    grupoSla,
    ativo,
    diasEmAberto,
    slaStatus,
    slaSeveridade,
    ofensor,
  };
}

/**
 * Consolida um site a partir dos seus serviços e da equipe.
 * `ref` é a data de referência (hoje), injetável para testes.
 */
export function calcularSite(
  site: Site,
  servicosBrutos: ReadonlyArray<Servico>,
  pessoas: ReadonlyArray<Pessoa>,
  ref: Date = new Date(),
  config: SlaConfig = DEFAULT_SLA_CONFIG,
): SiteCalculado {
  const servicos = servicosBrutos.map((s) => calcularServico(s, ref, config));
  const ativos = servicos.filter((s) => s.ativo);

  // Ofensor: considera serviços ativos + complementares ativos (5.3).
  const complementaresAtivos = servicos.filter(
    (s) => s.grupoSla === "complementar" && isSituacaoAtiva(s.situacao),
  );
  const ofensores = [...ativos, ...complementaresAtivos].map((s) => s.ofensor);
  const ofensorPrinc = ofensorPrincipal(ofensores);

  // SLA mais crítico entre os serviços ativos (5.5).
  const maisCritico = ativos.reduce<ServicoCalculado | null>((acc, s) => {
    if (acc === null || s.slaSeveridade > acc.slaSeveridade) return s;
    return acc;
  }, null);

  const atualizacao = calcularAtualizacao(servicos, ref, config);

  const licenciador = derivarLicenciador(servicos, pessoas);

  const statusFaturamento = statusFaturamentoSite(servicosBrutos, site.cliente);

  const score = calcularScore({
    ofensorPrincipal: ofensorPrinc,
    statusAtualizacao: atualizacao.status,
    diasServicoMaisCritico: maisCritico?.diasEmAberto ?? 0,
    qtdServicosAtivos: ativos.length,
  });

  return {
    ...site,
    servicos,
    qtdServicosAtivos: ativos.length,
    licenciador,
    ofensorPrincipal: ofensorPrinc,
    slaStatus: maisCritico?.slaStatus ?? "Sem SLA",
    slaSeveridade: maisCritico?.slaSeveridade ?? 0,
    ultimaAtualizacao: atualizacao.ultimaAtualizacao,
    statusAtualizacao: atualizacao.status,
    diasSemAtualizacao: atualizacao.diasSemAtualizacao,
    statusFaturamento,
    score,
  };
}

/** Um site é ativo quando tem pelo menos um serviço ativo (5.1). */
export function siteAtivo(site: SiteCalculado): boolean {
  return site.qtdServicosAtivos > 0;
}

/** Calcula vários sites a partir de uma base plana de serviços. */
export function calcularSites(
  sites: ReadonlyArray<Site>,
  servicos: ReadonlyArray<Servico>,
  pessoas: ReadonlyArray<Pessoa>,
  ref: Date = new Date(),
  config: SlaConfig = DEFAULT_SLA_CONFIG,
): SiteCalculado[] {
  const porSite = new Map<string, Servico[]>();
  for (const s of servicos) {
    const arr = porSite.get(s.siteId) ?? [];
    arr.push(s);
    porSite.set(s.siteId, arr);
  }
  return sites.map((site) =>
    calcularSite(site, porSite.get(site.id) ?? [], pessoas, ref, config),
  );
}
