import { describe, expect, it } from "vitest";
import {
  calcularServico,
  derivarLicenciador,
  SEM_RESPONSAVEL,
  type Pessoa,
  type Servico,
} from "@/domain";

const HOJE = new Date("2026-06-03T12:00:00Z");

const equipe: Pessoa[] = [
  { id: "1", nome: "Pedro Assis", papel: "viabilidade", ativo: true },
  { id: "2", nome: "Stephany Rodrigues", papel: "viabilidade", ativo: true },
  { id: "3", nome: "Keila Santos", papel: "licenciador", regiao: "Bahia", ativo: true },
  { id: "4", nome: "Juliana Sena", papel: "licenciador", ativo: true },
  { id: "5", nome: "Rose Castro", papel: "projetista", ativo: true },
  { id: "6", nome: "Guilherme Soares", papel: "complementar", ativo: true },
  { id: "7", nome: "Vanessa Santana", papel: "gerente", ativo: true },
];

function servico(p: Partial<Servico>): Servico {
  return {
    id: Math.random().toString(),
    siteId: "S1",
    classificacao: "Licença Urbanística",
    situacao: "Pendência",
    dataAcionamento: HOJE.toISOString(),
    ...p,
  };
}

function calc(servicos: Servico[]) {
  return servicos.map((s) => calcularServico(s, HOJE));
}

describe("licenciador do site (5.2)", () => {
  it("mostra os dois quando há viabilidade + licenciamento ativos", () => {
    const servicos = calc([
      servico({ classificacao: "Viabilidade - CUOS", situacao: "Pendência", responsavel: "Pedro Assis" }),
      servico({ classificacao: "Licença Urbanística", situacao: "Aberto/Acionado", responsavel: "Keila Santos" }),
    ]);
    expect(derivarLicenciador(servicos, equipe)).toBe("Pedro Assis / Keila Santos");
  });

  it("só viabilidade ativa → responsável da viabilidade", () => {
    const servicos = calc([
      servico({ classificacao: "Viabilidade - Inexigibilidade", situacao: "Pendência", responsavel: "Stephany Rodrigues" }),
    ]);
    expect(derivarLicenciador(servicos, equipe)).toBe("Stephany Rodrigues");
  });

  it("só licenciamento ativo → responsável do licenciamento", () => {
    const servicos = calc([
      servico({ classificacao: "Protocolo Ambiental", situacao: "Iniciado (protocolado)", responsavel: "Juliana Sena" }),
    ]);
    expect(derivarLicenciador(servicos, equipe)).toBe("Juliana Sena");
  });

  it("sem serviços ativos → sem licenciador (null)", () => {
    const servicos = calc([
      servico({ classificacao: "Licença Urbanística", situacao: "Concluído (faturado)", responsavel: "Keila Santos" }),
    ]);
    expect(derivarLicenciador(servicos, equipe)).toBeNull();
  });

  it("exclui projetista e complementares do cálculo", () => {
    const servicos = calc([
      servico({ classificacao: "Licença Urbanística", situacao: "Pendência", responsavel: "Rose Castro" }),
    ]);
    expect(derivarLicenciador(servicos, equipe)).toBe(SEM_RESPONSAVEL);
  });

  it("sinaliza ⚠ Sem responsável quando ativo sem responsável", () => {
    const servicos = calc([
      servico({ classificacao: "Licença Urbanística", situacao: "Pendência", responsavel: null }),
    ]);
    expect(derivarLicenciador(servicos, equipe)).toBe(SEM_RESPONSAVEL);
  });
});
