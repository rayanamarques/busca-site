import { describe, expect, it } from "vitest";
import { calcularScore, calcularSite, type Pessoa, type Servico, type Site } from "@/domain";

const HOJE = new Date("2026-06-03T12:00:00Z");

function diasAtras(n: number): string {
  const d = new Date(HOJE);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

const equipe: Pessoa[] = [
  { id: "1", nome: "Pedro Assis", papel: "viabilidade", ativo: true },
  { id: "3", nome: "Keila Santos", papel: "licenciador", regiao: "Bahia", ativo: true },
];

function servico(p: Partial<Servico>): Servico {
  return {
    id: Math.random().toString(),
    siteId: "S1",
    classificacao: "Licença Urbanística",
    situacao: "Pendência",
    ...p,
  };
}

describe("agregação do site (4.1 / 5)", () => {
  const site: Site = {
    id: "S1",
    siteIdCliente: "TTBAVAZ0004",
    municipio: "Salvador",
    uf: "BA",
    cliente: "TBSA",
  };

  it("consolida licenciador, ofensor, SLA crítico, atualização e score", () => {
    const servicos: Servico[] = [
      servico({
        classificacao: "Viabilidade - CUOS",
        situacao: "Pendência",
        responsavel: "Pedro Assis",
        dataAcionamento: diasAtras(20),
        dataAtualizacaoLpu: diasAtras(10),
      }),
      servico({
        classificacao: "Licença Urbanística",
        situacao: "Iniciado (protocolado)",
        responsavel: "Keila Santos",
        dataAcionamento: diasAtras(70),
        dataAtualizacaoLpu: diasAtras(2),
      }),
    ];

    const r = calcularSite(site, servicos, equipe, HOJE);

    expect(r.qtdServicosAtivos).toBe(2);
    // Caso-chave do discovery: viabilidade + licenciamento → dois responsáveis.
    expect(r.licenciador).toBe("Pedro Assis / Keila Santos");
    // CUOS Pendência → BS; Licença protocolada → Órgão. Hierarquia: Órgão vence BS.
    expect(r.ofensorPrincipal).toBe("Órgão");
    // Licença 70 dias → Estourado é o SLA mais crítico.
    expect(r.slaStatus).toBe("Estourado");
    // Última atualização = mais recente entre ativos (2 dias) → controle interno.
    expect(r.diasSemAtualizacao).toBe(2);
    expect(r.statusAtualizacao).toBe("Controle interno");
    // score = (pesoÓrgão 500 + bônus 0 + diasCrítico 70) × 2 serviços = 1140.
    expect(r.score).toBe(1140);
  });

  it("site sem serviços ativos não tem licenciador nem score", () => {
    const servicos: Servico[] = [
      servico({ situacao: "Concluído (faturado)", nfse: "NF1", responsavel: "Keila Santos" }),
    ];
    const r = calcularSite(site, servicos, equipe, HOJE);
    expect(r.qtdServicosAtivos).toBe(0);
    expect(r.licenciador).toBeNull();
    expect(r.score).toBe(0);
    expect(r.slaStatus).toBe("Sem SLA");
  });

  it("aquisição e complementar não contam como serviço ativo (5.1)", () => {
    const servicos: Servico[] = [
      servico({ classificacao: "Aquisição - Campo", situacao: "Pendência" }),
      servico({ classificacao: "Serviços Complementares", situacao: "Pendência" }),
    ];
    const r = calcularSite(site, servicos, equipe, HOJE);
    expect(r.qtdServicosAtivos).toBe(0);
    // Mas o complementar ativo ainda define o ofensor do site.
    expect(r.ofensorPrincipal).toBe("Serv. Compl.");
  });
});

describe("score de prioridade (5.7)", () => {
  it("BS pesa mais que Órgão e Cliente, e escala com nº de serviços", () => {
    const bs = calcularScore({
      ofensorPrincipal: "BS",
      statusAtualizacao: "Vencida",
      diasServicoMaisCritico: 10,
      qtdServicosAtivos: 3,
    });
    // (1000 + 300 + 10) × 3 = 3930
    expect(bs).toBe(3930);

    const cliente = calcularScore({
      ofensorPrincipal: "Cliente",
      statusAtualizacao: "Controle interno",
      diasServicoMaisCritico: 10,
      qtdServicosAtivos: 3,
    });
    // (300 + 0 + 10) × 3 = 930
    expect(cliente).toBe(930);
    expect(bs).toBeGreaterThan(cliente);
  });

  it("retorna 0 sem serviços ativos", () => {
    expect(
      calcularScore({
        ofensorPrincipal: "BS",
        statusAtualizacao: "Vencida",
        diasServicoMaisCritico: 100,
        qtdServicosAtivos: 0,
      }),
    ).toBe(0);
  });
});
