/**
 * Métricas do dashboard executivo — seção 8.4.
 *
 * Deriva indicadores a partir dos sites já calculados pela camada de domínio.
 * Funções puras (sem dependência de banco/UI).
 */

import {
  isSituacaoAtiva,
  type Cliente,
  type GrupoSla,
  type Ofensor,
  type ServicoCalculado,
  type SiteCalculado,
  type StatusFaturamento,
} from "@/domain";

export interface ResumoPainel {
  totalSites: number;
  sitesAtivos: number;
  pendentesPorEtapa: Record<GrupoSla, number>;
  ofensores: Record<Ofensor, number>;
  sla: { emRisco: number; estourado: number };
  faturamento: Record<StatusFaturamento, number>;
  atualizacoes: { vencidas: number; aHoje: number; interno: number; semData: number };
  porCliente: Record<Cliente, { ativos: number; total: number }>;
  cargaPorLicenciador: { nome: string; sites: number }[];
  topPrioridade: SiteCalculado[];
  topAtualizacao: SiteCalculado[];
}

const ETAPAS: GrupoSla[] = [
  "protocolo",
  "licenca",
  "viabilidade",
  "habite-se",
  "complementar",
  "aquisicao",
];

const OFENSORES: Ofensor[] = ["BS", "Órgão", "Cliente", "Serv. Compl."];

const CLIENTES: Cliente[] = ["TBSA", "WINITY", "IHS", "HIGHLINE", "SBA"];

const FATURAMENTOS: StatusFaturamento[] = [
  "A faturar",
  "Em espera (com PO)",
  "Em espera (sem PO)",
  "Faturado",
  "Sem faturamento",
];

function servicoAtivo(s: ServicoCalculado): boolean {
  return s.ativo || (s.grupoSla === "complementar" && isSituacaoAtiva(s.situacao));
}

export function resumirPainel(sites: SiteCalculado[]): ResumoPainel {
  const pendentesPorEtapa = Object.fromEntries(ETAPAS.map((e) => [e, 0])) as Record<
    GrupoSla,
    number
  >;
  const ofensores = Object.fromEntries(OFENSORES.map((o) => [o, 0])) as Record<Ofensor, number>;
  const faturamento = Object.fromEntries(FATURAMENTOS.map((f) => [f, 0])) as Record<
    StatusFaturamento,
    number
  >;
  const porCliente = Object.fromEntries(
    CLIENTES.map((c) => [c, { ativos: 0, total: 0 }]),
  ) as Record<Cliente, { ativos: number; total: number }>;
  const cargaMap = new Map<string, Set<string>>();

  let sitesAtivos = 0;
  let emRisco = 0;
  let estourado = 0;
  let vencidas = 0;
  let aHoje = 0;
  let interno = 0;
  let semData = 0;

  for (const site of sites) {
    porCliente[site.cliente].total++;
    const ativo = site.qtdServicosAtivos > 0;
    if (ativo) {
      sitesAtivos++;
      porCliente[site.cliente].ativos++;
    }

    if (site.ofensorPrincipal) ofensores[site.ofensorPrincipal]++;
    faturamento[site.statusFaturamento]++;

    // SLA agregado do site.
    if (site.slaStatus === "Em risco") emRisco++;
    else if (site.slaStatus === "Estourado") estourado++;

    // Atualização (só sites ativos importam).
    if (ativo) {
      if (site.statusAtualizacao === "Vencida") vencidas++;
      else if (site.statusAtualizacao === "Atualizar hoje") aHoje++;
      else if (site.statusAtualizacao === "Controle interno") interno++;
      else semData++;
    }

    // Pendentes por etapa: conta serviços ativos por grupo.
    for (const s of site.servicos) {
      if (servicoAtivo(s)) {
        pendentesPorEtapa[s.grupoSla]++;
      }
    }

    // Carga por licenciador: conta sites ativos distintos por nome de responsável.
    if (ativo && site.licenciador && !site.licenciador.startsWith("⚠")) {
      for (const nome of site.licenciador.split(/[/,]/).map((n) => n.trim())) {
        if (!nome) continue;
        const set = cargaMap.get(nome) ?? new Set<string>();
        set.add(site.id);
        cargaMap.set(nome, set);
      }
    }
  }

  const cargaPorLicenciador = [...cargaMap.entries()]
    .map(([nome, set]) => ({ nome, sites: set.size }))
    .sort((a, b) => b.sites - a.sites);

  const ativos = sites.filter((s) => s.qtdServicosAtivos > 0);
  const topPrioridade = [...ativos].sort((a, b) => b.score - a.score).slice(0, 15);
  const topAtualizacao = [...ativos]
    .filter((s) => s.diasSemAtualizacao !== null)
    .sort((a, b) => (b.diasSemAtualizacao ?? 0) - (a.diasSemAtualizacao ?? 0))
    .slice(0, 15);

  return {
    totalSites: sites.length,
    sitesAtivos,
    pendentesPorEtapa,
    ofensores,
    sla: { emRisco, estourado },
    faturamento,
    atualizacoes: { vencidas, aHoje, interno, semData },
    porCliente,
    cargaPorLicenciador,
    topPrioridade,
    topAtualizacao,
  };
}

/** Rótulo legível para grupos de SLA/etapa. */
export const LABEL_ETAPA: Record<GrupoSla, string> = {
  protocolo: "Protocolo",
  licenca: "Licença",
  viabilidade: "Viabilidade",
  "habite-se": "Habite-se",
  complementar: "Complementar",
  aquisicao: "Aquisição",
};
