/**
 * Tipos do domínio — Sistema de Gestão de Licenciamento (Busca Site).
 *
 * Fonte de verdade: CONTEXT.md (discovery) e a planilha ROLLOUT_LICENCIAMENTO_BS.
 * Esta camada é PURA (sem dependência de banco/UI) e é a parte mais testada do
 * sistema, conforme a seção 10 do discovery.
 */

/** Clientes atendidos (tower companies / operadoras) — seção 3.1. */
export type Cliente = "TBSA" | "WINITY" | "IHS" | "HIGHLINE" | "SBA";

/** Classificações de serviço — valores reais, seção 4.3. */
export type Classificacao =
  | "Viabilidade - CUOS"
  | "Viabilidade - Inexigibilidade"
  | "Protocolo Urbanístico"
  | "Licença Urbanística"
  | "Protocolo Ambiental"
  | "Licença Ambiental"
  | "Habite-se"
  | "Serviços Complementares"
  | "Aquisição - Campo";

/** Situações de serviço — valores reais, seção 4.4. */
export type Situacao =
  | "Aberto/Acionado"
  | "Pendência"
  | "Iniciado (protocolado)"
  | "Cliente"
  | "Concluído (faturado)"
  | "Finalizado (faturar)"
  | "Cancelado Não Faturável"
  | "Cancelado Faturável"
  | "Em Espera"
  | "Não Acionado"
  | "RC"
  | "Não Qualificado";

/** Papéis da equipe — seção 3.2. Define inclusão/exclusão nos cálculos. */
export type Papel =
  | "gerente"
  | "licenciador"
  | "viabilidade"
  | "projetista"
  | "complementar"
  | "socio"
  | "inativo";

/**
 * Grupo de SLA — agrupa classificações que compartilham a mesma régua (5.5).
 * "aquisicao" não possui SLA (não conta como serviço ativo, seção 5.1).
 */
export type GrupoSla =
  | "protocolo"
  | "licenca"
  | "viabilidade"
  | "habite-se"
  | "complementar"
  | "aquisicao";

/**
 * Ofensor — quem está "segurando" o andamento (seção 5.3).
 * Rótulo único padronizado: o nível de serviço usa "SHARING" na planilha, mas
 * aqui consolidamos para "Cliente" conforme nota de nomenclatura da seção 5.3.
 */
export type Ofensor = "BS" | "Órgão" | "Cliente" | "Serv. Compl.";

/** Status de SLA de um serviço (faixas da régua + estados especiais, 5.5). */
export type SlaStatus =
  | "No prazo"
  | "Em acompanhamento"
  | "Em risco"
  | "Estourado"
  | "Serviço finalizado"
  | "Não acionado"
  | "Acionar no sistema"
  | "Verificar data"
  | "Sem SLA";

/** Status de atualização do cliente — seção 5.6. */
export type StatusAtualizacao =
  | "Controle interno"
  | "Atualizar hoje"
  | "Vencida"
  | "Sem data";

/** Status de faturamento agregado do site — seção 5.4. */
export type StatusFaturamento =
  | "A faturar"
  | "Faturado"
  | "Em espera (com PO)"
  | "Em espera (sem PO)"
  | "Sem faturamento";

/** Pessoa da equipe — seção 3.2 / 4.2. */
export interface Pessoa {
  id: string;
  nome: string;
  papel: Papel;
  regiao?: string;
  ativo: boolean;
}

/**
 * Serviço (linha bruta) — a granularidade primária do domínio (seção 4.1).
 * Cada site tem várias linhas, uma por etapa.
 */
export interface Servico {
  id: string;
  siteId: string;
  classificacao: Classificacao;
  situacao: Situacao;
  /** Nome do responsável técnico (pode estar vazio na base legada). */
  responsavel?: string | null;
  /** Data de acionamento da LPU — base do cálculo de dias em aberto. */
  dataAcionamento?: string | null; // ISO date
  /** Data de entrega/conclusão. */
  dataEntrega?: string | null;
  /** Data da última atualização (LPU) reportada ao cliente. */
  dataAtualizacaoLpu?: string | null;
  /** Purchase Order do cliente (pré-requisito de faturamento). */
  po?: string | null;
  /** Nota fiscal de serviço eletrônica emitida. */
  nfse?: string | null;
}

/** Site — local físico identificado por um código (seção 2 / 4.2). */
export interface Site {
  id: string;
  siteIdCliente?: string | null;
  siteOperadora?: string | null;
  municipio?: string | null;
  uf?: string | null;
  cliente: Cliente;
}

/** Serviço com cálculos derivados (saída da camada de serviço). */
export interface ServicoCalculado extends Servico {
  grupoSla: GrupoSla;
  /** É um serviço de licenciamento/viabilidade em situação ativa (5.1). */
  ativo: boolean;
  diasEmAberto: number | null;
  slaStatus: SlaStatus;
  /** Severidade numérica para escolher o SLA mais crítico do site (5.5). */
  slaSeveridade: number;
  ofensor: Ofensor | null;
}

/** Site consolidado — visão gerencial agregada (seção 4.1 / 5). */
export interface SiteCalculado extends Site {
  servicos: ServicoCalculado[];
  qtdServicosAtivos: number;
  /** Texto do(s) licenciador(es), ex.: "Pedro Assis / Keila Santos" (5.2). */
  licenciador: string | null;
  ofensorPrincipal: Ofensor | null;
  slaStatus: SlaStatus;
  slaSeveridade: number;
  ultimaAtualizacao: string | null;
  statusAtualizacao: StatusAtualizacao;
  diasSemAtualizacao: number | null;
  statusFaturamento: StatusFaturamento;
  score: number;
}
