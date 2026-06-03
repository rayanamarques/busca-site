/**
 * Ofensor — quem está "segurando" o site — seção 5.3.
 *
 * Nível de serviço:
 *   - Cliente (Sharing): situação "Cliente".
 *   - Órgão: situação "Iniciado (protocolado)".
 *   - BS: situação "Aberto/Acionado", "Pendência" ou "Não Acionado".
 *   - Serv. Compl.: serviço complementar ativo (tratado na agregação do site).
 *
 * Nível de site (ofensor principal): hierarquia Cliente → Órgão → BS, com
 * Serv. Compl. apenas quando só há complementar ativo.
 */

import { isComplementar } from "./normalize";
import type { Classificacao, Ofensor, Situacao } from "./types";

/** Ofensor de um único serviço, a partir da situação. `null` se terminal. */
export function ofensorDoServico(
  classificacao: Classificacao,
  situacao: Situacao,
): Ofensor | null {
  switch (situacao) {
    case "Cliente":
      return "Cliente";
    case "Iniciado (protocolado)":
      return "Órgão";
    case "Aberto/Acionado":
    case "Pendência":
    case "Não Acionado":
      return isComplementar(classificacao) ? "Serv. Compl." : "BS";
    default:
      // Situações terminais não têm ofensor.
      return null;
  }
}

/**
 * Ofensor principal do site, agregando os ofensores dos serviços.
 * Hierarquia de prioridade (5.3): Cliente (Sharing) → Órgão → BS → Serv. Compl.
 */
export function ofensorPrincipal(ofensores: ReadonlyArray<Ofensor | null>): Ofensor | null {
  const presentes = new Set(ofensores.filter((o): o is Ofensor => o !== null));
  if (presentes.size === 0) return null;
  if (presentes.has("Cliente")) return "Cliente";
  if (presentes.has("Órgão")) return "Órgão";
  if (presentes.has("BS")) return "BS";
  return "Serv. Compl.";
}
