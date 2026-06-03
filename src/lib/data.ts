import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  calcularSites,
  normalizeClassificacao,
  normalizeSituacao,
  type Cliente,
  type Pessoa,
  type Servico,
  type Site,
  type SiteCalculado,
} from "@/domain";

interface PessoaRow {
  id: string;
  nome: string;
  papel: Pessoa["papel"];
  regiao: string | null;
  ativo: boolean;
}

interface SiteRow {
  id: string;
  site_id_cliente: string | null;
  site_operadora: string | null;
  municipio: string | null;
  uf: string | null;
  cliente: Cliente;
}

interface ServicoRow {
  id: string;
  site_id: string;
  classificacao: string;
  situacao: string;
  responsavel: string | null;
  data_acionamento: string | null;
  data_entrega: string | null;
  data_atualizacao_lpu: string | null;
  po: string | null;
  nfse: string | null;
}

function mapServico(r: ServicoRow): Servico | null {
  const classificacao = normalizeClassificacao(r.classificacao);
  const situacao = normalizeSituacao(r.situacao);
  // Linhas que não normalizam são reportadas como problema de dado, não quebram o painel.
  if (!classificacao || !situacao) return null;
  return {
    id: r.id,
    siteId: r.site_id,
    classificacao,
    situacao,
    responsavel: r.responsavel,
    dataAcionamento: r.data_acionamento,
    dataEntrega: r.data_entrega,
    dataAtualizacaoLpu: r.data_atualizacao_lpu,
    po: r.po,
    nfse: r.nfse,
  };
}

export interface DadosPainel {
  sites: SiteCalculado[];
  pessoas: Pessoa[];
  /** Serviços brutos que não puderam ser normalizados (qualidade de dado). */
  servicosInvalidos: number;
}

/** Carrega tudo do Supabase e devolve sites já calculados pela camada de domínio. */
export async function carregarPainel(): Promise<DadosPainel> {
  const supabase = await createClient();

  const [pessoasRes, sitesRes, servicosRes] = await Promise.all([
    supabase.from("pessoas").select("*"),
    supabase.from("sites").select("*"),
    supabase.from("servicos").select("*"),
  ]);

  if (pessoasRes.error) throw pessoasRes.error;
  if (sitesRes.error) throw sitesRes.error;
  if (servicosRes.error) throw servicosRes.error;

  const pessoas: Pessoa[] = (pessoasRes.data as PessoaRow[]).map((p) => ({
    id: p.id,
    nome: p.nome,
    papel: p.papel,
    regiao: p.regiao ?? undefined,
    ativo: p.ativo,
  }));

  const sites: Site[] = (sitesRes.data as SiteRow[]).map((s) => ({
    id: s.id,
    siteIdCliente: s.site_id_cliente,
    siteOperadora: s.site_operadora,
    municipio: s.municipio,
    uf: s.uf,
    cliente: s.cliente,
  }));

  const servicosRaw = servicosRes.data as ServicoRow[];
  const servicos: Servico[] = [];
  let invalidos = 0;
  for (const r of servicosRaw) {
    const m = mapServico(r);
    if (m) servicos.push(m);
    else invalidos++;
  }

  const calculados = calcularSites(sites, servicos, pessoas, new Date());
  // Ordena por score desc (o que atacar primeiro).
  calculados.sort((a, b) => b.score - a.score);

  return { sites: calculados, pessoas, servicosInvalidos: invalidos };
}
