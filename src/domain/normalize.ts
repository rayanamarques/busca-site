/**
 * Normalização de dados legados — seção 4.3 / 12 (qualidade de dado).
 *
 * A base do WDM tem inconsistências de digitação: "Urbanistico" sem acento,
 * "Inexibilidade", Site ID ora texto ora número. O sistema novo deve normalizar
 * na entrada (importador e formulários).
 */

import type { Classificacao, GrupoSla, Situacao } from "./types";

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function key(s: string): string {
  return stripAccents(s).toLowerCase().replace(/\s+/g, " ").trim();
}

/** Mapa de variações ortográficas conhecidas -> valor canônico. */
const CLASSIFICACAO_ALIASES: Record<string, Classificacao> = {
  "viabilidade - cuos": "Viabilidade - CUOS",
  "viabilidade cuos": "Viabilidade - CUOS",
  cuos: "Viabilidade - CUOS",
  "viabilidade - inexigibilidade": "Viabilidade - Inexigibilidade",
  "viabilidade - inexibilidade": "Viabilidade - Inexigibilidade", // erro comum
  inexigibilidade: "Viabilidade - Inexigibilidade",
  inexibilidade: "Viabilidade - Inexigibilidade",
  "protocolo urbanistico": "Protocolo Urbanístico",
  "protocolo urb": "Protocolo Urbanístico",
  "licenca urbanistica": "Licença Urbanística",
  "licenca urb": "Licença Urbanística",
  "protocolo ambiental": "Protocolo Ambiental",
  "protocolo amb": "Protocolo Ambiental",
  "licenca ambiental": "Licença Ambiental",
  "licenca amb": "Licença Ambiental",
  "habite-se": "Habite-se",
  "habite se": "Habite-se",
  habitese: "Habite-se",
  "servicos complementares": "Serviços Complementares",
  "servico complementar": "Serviços Complementares",
  complementar: "Serviços Complementares",
  complementares: "Serviços Complementares",
  "aquisicao - campo": "Aquisição - Campo",
  "aquisicao campo": "Aquisição - Campo",
  aquisicao: "Aquisição - Campo",
};

const SITUACAO_ALIASES: Record<string, Situacao> = {
  "aberto/acionado": "Aberto/Acionado",
  aberto: "Aberto/Acionado",
  acionado: "Aberto/Acionado",
  pendencia: "Pendência",
  "iniciado (protocolado)": "Iniciado (protocolado)",
  iniciado: "Iniciado (protocolado)",
  protocolado: "Iniciado (protocolado)",
  cliente: "Cliente",
  sharing: "Cliente", // nomenclatura unificada (5.3)
  "concluido (faturado)": "Concluído (faturado)",
  concluido: "Concluído (faturado)",
  faturado: "Concluído (faturado)",
  "finalizado (faturar)": "Finalizado (faturar)",
  finalizado: "Finalizado (faturar)",
  faturar: "Finalizado (faturar)",
  "cancelado nao faturavel": "Cancelado Não Faturável",
  "cancelado faturavel": "Cancelado Faturável",
  "em espera": "Em Espera",
  espera: "Em Espera",
  "nao acionado": "Não Acionado",
  rc: "RC",
  "nao qualificado": "Não Qualificado",
};

/** Normaliza uma classificação livre para o valor canônico (ou null se desconhecida). */
export function normalizeClassificacao(raw: string | null | undefined): Classificacao | null {
  if (!raw) return null;
  return CLASSIFICACAO_ALIASES[key(raw)] ?? null;
}

/** Normaliza uma situação livre para o valor canônico (ou null se desconhecida). */
export function normalizeSituacao(raw: string | null | undefined): Situacao | null {
  if (!raw) return null;
  return SITUACAO_ALIASES[key(raw)] ?? null;
}

/** Normaliza um Site ID (texto ou número) para string sem espaços. */
export function normalizeSiteId(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  return s.length ? s : null;
}

/** Situações consideradas "ativas" (serviço em andamento) — seção 4.4. */
const SITUACOES_ATIVAS: ReadonlySet<Situacao> = new Set<Situacao>([
  "Aberto/Acionado",
  "Pendência",
  "Iniciado (protocolado)",
  "Cliente",
]);

export function isSituacaoAtiva(s: Situacao): boolean {
  return SITUACOES_ATIVAS.has(s);
}

/** Grupo de SLA de cada classificação (seção 5.5). */
export function grupoSlaDe(c: Classificacao): GrupoSla {
  switch (c) {
    case "Protocolo Urbanístico":
    case "Protocolo Ambiental":
      return "protocolo";
    case "Licença Urbanística":
    case "Licença Ambiental":
      return "licenca";
    case "Viabilidade - CUOS":
    case "Viabilidade - Inexigibilidade":
      return "viabilidade";
    case "Habite-se":
      return "habite-se";
    case "Serviços Complementares":
      return "complementar";
    case "Aquisição - Campo":
      return "aquisicao";
  }
}

/** Viabilidade ou licenciamento? (contam para "site ativo" e licenciador, 5.1/5.2). */
export function isLicenciamentoOuViabilidade(c: Classificacao): boolean {
  const g = grupoSlaDe(c);
  return g === "protocolo" || g === "licenca" || g === "viabilidade" || g === "habite-se";
}

export function isViabilidade(c: Classificacao): boolean {
  return grupoSlaDe(c) === "viabilidade";
}

export function isLicenciamento(c: Classificacao): boolean {
  const g = grupoSlaDe(c);
  return g === "protocolo" || g === "licenca" || g === "habite-se";
}

export function isComplementar(c: Classificacao): boolean {
  return grupoSlaDe(c) === "complementar";
}
