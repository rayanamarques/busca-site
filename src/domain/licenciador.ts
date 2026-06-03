/**
 * Licenciador do site — seção 5.2.
 *
 * - Sem serviços ativos → sem licenciador (null).
 * - Viabilidade ativa E licenciamento ativo → "resp_viab / resp_licenc".
 * - Só viabilidade ativa → responsável da viabilidade.
 * - Só licenciamento ativo → responsável do licenciamento.
 * - Excluir do cálculo: projetista (Rose Castro) e quem só atua em complementares.
 * - Sem responsável preenchido → "⚠ Sem responsável".
 */

import { isLicenciamento, isViabilidade } from "./normalize";
import type { Papel, Pessoa, ServicoCalculado } from "./types";

export const SEM_RESPONSAVEL = "⚠ Sem responsável";

/** Papéis que NÃO entram no cálculo de licenciador (5.2). */
const PAPEIS_EXCLUIDOS: ReadonlySet<Papel> = new Set<Papel>([
  "projetista",
  "complementar",
  "gerente",
  "inativo",
]);

/** Indexa pessoas por nome (normalizado) para consultar papel. */
function indexarPorNome(pessoas: ReadonlyArray<Pessoa>): Map<string, Pessoa> {
  const m = new Map<string, Pessoa>();
  for (const p of pessoas) m.set(p.nome.trim().toLowerCase(), p);
  return m;
}

function pessoaExcluida(nome: string, idx: Map<string, Pessoa>): boolean {
  const p = idx.get(nome.trim().toLowerCase());
  return p ? PAPEIS_EXCLUIDOS.has(p.papel) : false;
}

/** Coleta nomes de responsáveis distintos de um conjunto de serviços, na ordem. */
function responsaveis(
  servicos: ReadonlyArray<ServicoCalculado>,
  idx: Map<string, Pessoa>,
): string[] {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const s of servicos) {
    const nome = s.responsavel?.trim();
    if (!nome) continue;
    if (pessoaExcluida(nome, idx)) continue;
    if (vistos.has(nome.toLowerCase())) continue;
    vistos.add(nome.toLowerCase());
    out.push(nome);
  }
  return out;
}

/**
 * Deriva o texto do licenciador do site.
 * Retorna `null` quando não há serviços ativos de licenciamento/viabilidade.
 */
export function derivarLicenciador(
  servicos: ReadonlyArray<ServicoCalculado>,
  pessoas: ReadonlyArray<Pessoa>,
): string | null {
  const idx = indexarPorNome(pessoas);

  const ativosViab = servicos.filter((s) => s.ativo && isViabilidade(s.classificacao));
  const ativosLicenc = servicos.filter((s) => s.ativo && isLicenciamento(s.classificacao));

  const temViab = ativosViab.length > 0;
  const temLicenc = ativosLicenc.length > 0;

  // Sem serviços ativos de viabilidade/licenciamento → sem licenciador.
  if (!temViab && !temLicenc) return null;

  const nomesViab = responsaveis(ativosViab, idx);
  const nomesLicenc = responsaveis(ativosLicenc, idx);

  if (temViab && temLicenc) {
    const viab = nomesViab.join(", ") || SEM_RESPONSAVEL;
    const licenc = nomesLicenc.join(", ") || SEM_RESPONSAVEL;
    return `${viab} / ${licenc}`;
  }

  const nomes = temViab ? nomesViab : nomesLicenc;
  return nomes.length ? nomes.join(", ") : SEM_RESPONSAVEL;
}
